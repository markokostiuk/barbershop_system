from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models import db, Admin, Branch, Position, Service, ServiceCost, Worker, WorkerWorkHours
from datetime import time, datetime, timedelta

manager_bp = Blueprint('manager', __name__)

def get_current_admin():
    try:
        admin_id = get_jwt_identity()
        return Admin.query.get(admin_id)
    except Exception as e:
        print(f"JWT identity error: {e}")
        return None

def manager_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        admin = get_current_admin()
        if admin.role != 'manager':
            return jsonify({'error': 'Manager access required'}), 403
        return f(*args, **kwargs)
    return decorated

def check_branch_access(branch_id):
    admin = get_current_admin()
    # Check if admin manages the branch
    branch = Branch.query.filter(Branch.id == branch_id, Branch.managers.any(id=admin.id)).first()
    if not branch:
        return jsonify({'error': 'Access denied to this branch'}), 403
    return None

@manager_bp.route('/branches', methods=['GET'])
@manager_required
def get_branches():
    admin = get_current_admin()
    branches = Branch.query.filter(Branch.managers.any(id=admin.id)).all()
    return jsonify([{
        'id': b.id,
        'name': b.name,
        'locality': b.locality,
        'address': b.address,
        'phone_number': b.phone_number,
        'start_work_hour': b.start_work_hour.isoformat(),
        'end_work_hour': b.end_work_hour.isoformat()
    } for b in branches])

# -------------------- Position Routes --------------------
@manager_bp.route('/branches/<int:branch_id>/positions', methods=['POST'])
@manager_required
def create_position(branch_id):
    error = check_branch_access(branch_id)
    if error:
        return error

    data = request.get_json()
    try:
        new_position = Position(
            name=data['name'],
            branch_id=branch_id
        )
        db.session.add(new_position)
        db.session.commit()
        return jsonify({'message': 'Position created', 'id': new_position.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@manager_bp.route('/branches/<int:branch_id>/positions', methods=['GET'])
@manager_required
def get_positions(branch_id):
    error = check_branch_access(branch_id)
    if error:
        return error
    
    positions = Position.query.filter_by(branch_id=branch_id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'workers_count': len(p.workers)
    } for p in positions])

@manager_bp.route('/positions/<int:position_id>', methods=['PUT'])
@manager_required
def update_position(position_id):
    position = Position.query.get_or_404(position_id)
    error = check_branch_access(position.branch_id)
    if error:
        return error
    
    data = request.get_json()
    if 'name' in data:
        if Position.query.filter_by(name=data['name'], branch_id=position.branch_id).first():
            return jsonify({'error': 'Position name exists'}), 400
        position.name = data['name']
    
    db.session.commit()
    return jsonify({'message': 'Position updated'})

@manager_bp.route('/positions/<int:position_id>', methods=['DELETE'])
@manager_required
def delete_position(position_id):
    position = Position.query.get_or_404(position_id)
    error = check_branch_access(position.branch_id)
    if error:
        return error
    
    if len(position.workers) > 0:
        return jsonify({'error': 'Reassign workers first'}), 400
    
    db.session.delete(position)
    db.session.commit()
    return jsonify({'message': 'Position deleted'})

# -------------------- Service Routes --------------------
@manager_bp.route('/branches/<int:branch_id>/services', methods=['POST'])
@manager_required
def create_service(branch_id):
    error = check_branch_access(branch_id)
    if error:
        return error

    data = request.get_json()
    try:
        new_service = Service(
            name=data['name'],
            duration=data['duration'],
            branch_id=branch_id
        )
        db.session.add(new_service)
        db.session.commit()
        return jsonify({'message': 'Service created', 'id': new_service.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@manager_bp.route('/branches/<int:branch_id>/services', methods=['GET'])
@manager_required
def get_services(branch_id):
    error = check_branch_access(branch_id)
    if error:
        return error
    
    services = Service.query.filter_by(branch_id=branch_id).all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'duration': s.duration,
        'price_options': len(s.service_costs)
    } for s in services])

@manager_bp.route('/services/<int:service_id>', methods=['PUT'])
@manager_required
def update_service(service_id):
    service = Service.query.get_or_404(service_id)
    error = check_branch_access(service.branch_id)
    if error:
        return error
    
    data = request.get_json()
    if 'name' in data:
        if Service.query.filter_by(name=data['name'], branch_id=service.branch_id).first():
            return jsonify({'error': 'Service name exists'}), 400
        service.name = data['name']
    
    if 'duration' in data:
        if not isinstance(data['duration'], int) or data['duration'] <= 0:
            return jsonify({'error': 'Invalid duration'}), 400
        service.duration = data['duration']
    
    db.session.commit()
    return jsonify({'message': 'Service updated'})

@manager_bp.route('/services/<int:service_id>', methods=['DELETE'])
@manager_required
def delete_service(service_id):
    service = Service.query.get_or_404(service_id)
    error = check_branch_access(service.branch_id)
    if error:
        return error
    
    if len(service.service_costs) > 0:
        return jsonify({'error': 'Delete service costs first'}), 400
    
    db.session.delete(service)
    db.session.commit()
    return jsonify({'message': 'Service deleted'})

# -------------------- ServiceCost Routes --------------------
@manager_bp.route('/services/<int:service_id>/costs', methods=['POST'])
@manager_required
def set_service_cost(service_id):
    service = Service.query.get_or_404(service_id)
    error = check_branch_access(service.branch_id)
    if error:
        return error

    data = request.get_json()
    try:
        position = Position.query.get_or_404(data['position_id'])
        if position.branch_id != service.branch_id:
            return jsonify({'error': 'Position and service must be from the same branch'}), 400

        new_cost = ServiceCost(
            position_id=data['position_id'],
            service_id=service_id,
            price=data['price']
        )
        db.session.add(new_cost)
        db.session.commit()
        return jsonify({'message': 'Service cost added'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@manager_bp.route('/service-costs/<int:cost_id>', methods=['PUT'])
@manager_required
def update_service_cost(cost_id):
    cost = ServiceCost.query.get_or_404(cost_id)
    error = check_branch_access(cost.service.branch_id)
    if error:
        return error

    data = request.get_json()
    if 'price' in data:
        cost.price = data['price']
    db.session.commit()
    return jsonify({'message': 'Service cost updated'})

@manager_bp.route('/service-costs/<int:cost_id>', methods=['DELETE'])
@manager_required
def delete_service_cost(cost_id):
    cost = ServiceCost.query.get_or_404(cost_id)
    error = check_branch_access(cost.service.branch_id)
    if error:
        return error

    db.session.delete(cost)
    db.session.commit()
    return jsonify({'message': 'Service cost deleted'})

# -------------------- Worker Routes --------------------
@manager_bp.route('/branches/<int:branch_id>/workers', methods=['GET'])
@manager_required
def get_workers(branch_id):
    error = check_branch_access(branch_id)
    if error:
        return error

    workers = Worker.query.filter_by(branch_id=branch_id).all()
    return jsonify([{
        'id': w.id,
        'name': w.name,
        'position_id': w.position_id
    } for w in workers])

@manager_bp.route('/workers/<int:worker_id>', methods=['GET'])
@manager_required
def get_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error

    return jsonify({
        'id': worker.id,
        'name': worker.name,
        'position_id': worker.position_id,
        'branch_id': worker.branch_id
    })

@manager_bp.route('/workers/<int:worker_id>', methods=['PUT'])
@manager_required
def update_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error

    data = request.get_json()
    if 'name' in data:
        worker.name = data['name']
    if 'position_id' in data:
        position = Position.query.get(data['position_id'])
        if not position or position.branch_id != worker.branch_id:
            return jsonify({'error': 'Invalid position for this branch'}), 400
        worker.position_id = data['position_id']

    db.session.commit()
    return jsonify({'message': 'Worker updated'})

@manager_bp.route('/workers/<int:worker_id>', methods=['DELETE'])
@manager_required
def delete_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error

    if len(worker.work_hours) > 0:
        return jsonify({'error': 'Delete work hours first'}), 400

    db.session.delete(worker)
    db.session.commit()
    return jsonify({'message': 'Worker deleted'})

# -------------------- Worker Work Hours Routes --------------------
@manager_bp.route('/workers/<int:worker_id>/work-hours', methods=['POST', 'GET'])
@manager_required
def manage_work_hours(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            start = datetime.strptime(data['start_work_hour'], '%H:%M').time()
            end = datetime.strptime(data['end_work_hour'], '%H:%M').time()
            
            if start >= end:
                return jsonify({'error': 'Invalid time range'}), 400
                
            existing = WorkerWorkHours.query.filter_by(
                worker_id=worker_id,
                date=date
            ).first()
            
            if existing:
                return jsonify({'error': 'Work hours for this date already exist'}), 409
                
            new_wh = WorkerWorkHours(
                worker_id=worker_id,
                date=date,
                start_work_hour=start,
                end_work_hour=end
            )
            
            db.session.add(new_wh)
            db.session.commit()
            
            return jsonify({
                'id': new_wh.id,
                'date': new_wh.date.isoformat(),
                'start': new_wh.start_work_hour.strftime('%H:%M'),
                'end': new_wh.end_work_hour.strftime('%H:%M')
            }), 201
            
        except ValueError:
            return jsonify({'error': 'Invalid date/time format'}), 400
            
    elif request.method == 'GET':
        work_hours = WorkerWorkHours.query.filter_by(worker_id=worker_id).all()
        return jsonify([{
            'id': wh.id,
            'date': wh.date.isoformat(),
            'start': wh.start_work_hour.strftime('%H:%M'),
            'end': wh.end_work_hour.strftime('%H:%M')
        } for wh in work_hours])

@manager_bp.route('/work-hours/<int:work_hour_id>', methods=['PUT', 'DELETE'])
@manager_required
def modify_work_hour(work_hour_id):
    wh = WorkerWorkHours.query.get_or_404(work_hour_id)
    worker = Worker.query.get(wh.worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error
    
    if request.method == 'PUT':
        data = request.get_json()
        try:
            if 'start_work_hour' in data:
                wh.start_work_hour = datetime.strptime(data['start_work_hour'], '%H:%M').time()
            if 'end_work_hour' in data:
                wh.end_work_hour = datetime.strptime(data['end_work_hour'], '%H:%M').time()
            
            if wh.start_work_hour >= wh.end_work_hour:
                return jsonify({'error': 'Invalid time range'}), 400
                
            db.session.commit()
            return jsonify({'message': 'Work hours updated'})
            
        except ValueError:
            return jsonify({'error': 'Invalid time format'}), 400
            
    elif request.method == 'DELETE':
        db.session.delete(wh)
        db.session.commit()
        return jsonify({'message': 'Work hours deleted'})

@manager_bp.route('/workers/<int:worker_id>/batch-work-hours', methods=['POST'])
@manager_required
def add_batch_work_hours(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error
    
    data = request.get_json()
    try:
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        days_of_week = data.get('days_of_week', [0,1,2,3,4])
        
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() in days_of_week:
                if not WorkerWorkHours.query.filter_by(
                    worker_id=worker_id,
                    date=current_date
                ).first():
                    new_wh = WorkerWorkHours(
                        worker_id=worker_id,
                        date=current_date,
                        start_work_hour=datetime.strptime(data['start_time'], '%H:%M').time(),
                        end_work_hour=datetime.strptime(data['end_time'], '%H:%M').time()
                    )
                    db.session.add(new_wh)
            current_date += timedelta(days=1)
        
        db.session.commit()
        return jsonify({'message': 'Batch hours added'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
