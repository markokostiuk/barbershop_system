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

@manager_bp.route('/branchpositions', methods=['GET'])
@manager_required
def get_branches():
    admin = get_current_admin()
    positions = Position.query.filter_by(branch_id=admin.branch_id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
    } for p in positions])

# -------------------- Worker Work Hours Routes --------------------
@manager_bp.route('/workers', methods=['GET', 'POST'])
@manager_required
def manage_workers():
    admin = get_current_admin()
    if request.method == 'GET':
        # List workers for branches managed by this manager
        branches = Branch.query.filter(Branch.managers.any(id=admin.id)).all()
        branch_ids = [b.id for b in branches]

        workers = Worker.query.filter(Worker.branch_id.in_(branch_ids)).all()

        return jsonify([{
            'id': w.id,
            'name': w.name,
            'position': {
                'id': w.position.id,
                'name': w.position.name
            }
        } for w in workers])

    elif request.method == 'POST':
        data = request.get_json()
        try:
            name = data['name']
            position_id = data['position_id']
            branch_id = admin.branch_id
            # Check access to branch
            branch = Branch.query.filter(Branch.id == branch_id, Branch.managers.any(id=admin.id)).first()
            position = Position.query.filter(Position.id == position_id).first()
            if not branch:
                return jsonify({'error': 'Access denied to this branch'}), 403
            new_worker = Worker(name=name, position_id=position_id, branch_id=branch_id)
            db.session.add(new_worker)
            db.session.commit()
            return jsonify({
                'id': new_worker.id,
                'name': new_worker.name,
                'position': {
                    'id': new_worker.position.id,
                    'name': new_worker.position.name
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400

@manager_bp.route('/workers/<int:worker_id>', methods=['PUT', 'DELETE'])
@manager_required
def modify_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error
    if request.method == 'PUT':
        data = request.get_json()
        try:
            if 'name' in data:
                worker.name = data['name']
            if 'position' in data:
                worker.position = data['position']
            db.session.commit()
            return jsonify({'message': 'Worker updated'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
    elif request.method == 'DELETE':
        db.session.delete(worker)
        db.session.commit()
        return jsonify({'message': 'Worker deleted'})

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
        days_of_week = data.get('days_of_week', [0,1,2,3,4,5,6])
        
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