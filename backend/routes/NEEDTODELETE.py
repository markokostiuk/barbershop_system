from flask import Blueprint, request, jsonify, render_template
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from functools import wraps
from models import db, Business, Admin, Branch, Position, Service, ServiceCost, Worker, WorkerWorkHours
from datetime import time, datetime, timedelta
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import verify_jwt_in_request

admin_bp = Blueprint('admin', __name__)

# -------------------- Helpers --------------------
def get_current_admin():
    try:
        admin_id = get_jwt_identity()
        return Admin.query.get(admin_id)
    except Exception as e:
        print(f"JWT identity error: {e}")
        return None

def owner_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        admin = get_current_admin()
        if admin.role != 'owner':
            return jsonify({'error': 'Owner access required'}), 403
        return f(*args, **kwargs)
    return decorated

def manager_or_owner_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        admin = get_current_admin()
        if admin.role not in ['owner', 'manager']:
            return jsonify({'error': 'Access denied'}), 403
        return f(*args, **kwargs)
    return decorated

def developer_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        admin = get_current_admin()
        if admin.role != 'developer':
            return jsonify({'error': 'Developer access required'}), 403
        return f(*args, **kwargs)
    return decorated

def check_branch_access(branch_id):
    admin = get_current_admin()
    
    if admin.role == 'owner':
        # Check if admin owns the business that the branch belongs to
        branch = Branch.query.get(branch_id)
        if not branch:
            return jsonify({'error': 'Branch not found'}), 404
        if not branch.business_id:
            return jsonify({'error': 'Branch business not set'}), 400
        business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
        if not business:
            return jsonify({'error': 'Access denied to this branch'}), 403
    elif admin.role == 'manager':
        # Check if admin manages the branch
        branch = Branch.query.filter(Branch.id == branch_id, Branch.managers.any(id=admin.id)).first()
        if not branch:
            return jsonify({'error': 'Access denied to this branch'}), 403
    return None


# -------------------- Auth Routes --------------------
@admin_bp.route('/register', methods=['POST'])
def register_admin():
    from flask import current_app
    auth_header = request.headers.get('Authorization')
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    name = data.get('name', '')
    secret_key = data.get('secret_key', '')

    if not email or not password or not role:
        return jsonify({'error': 'Email, password, and role are required'}), 400

    if not auth_header:
        return jsonify({'error': 'Authorization header missing'}), 401
    try:
        verify_jwt_in_request()
        current_admin = get_current_admin()
        if not current_admin:
            return jsonify({'error': 'Invalid token or admin not found'}), 401
    except Exception as e:
        return jsonify({'error': f'Invalid token: {str(e)}'}), 401

    if role == 'owner' and current_admin.role != 'developer':
        return jsonify({'error': 'Only developer can register business owners'}), 403

    if Admin.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    hashed_password = generate_password_hash(password)
    new_admin = Admin(email=email, password=hashed_password, role=role, name=name)

    try:
        db.session.add(new_admin)
        db.session.commit()
        return jsonify({'message': 'Admin registered successfully', 'id': new_admin.id}), 201
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@admin_bp.route('/login', methods=['POST'])
def admin_login_post():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    admin = Admin.query.filter_by(email=email).first()
    if not admin or not check_password_hash(admin.password, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    from datetime import timedelta
    access_token = create_access_token(identity=str(admin.id), expires_delta=timedelta(hours=24))  # Token expires in 24 hours
    return jsonify({'access_token': access_token, 'role': admin.role, 'id': admin.id}), 200

# -------------------- Business Routes --------------------
@admin_bp.route('/businesses', methods=['POST'])
@owner_required
def create_business():
    admin = get_current_admin()
    data = request.get_json()
    
    try:
        new_business = Business(
            name=data['name']
        )
        db.session.add(new_business)
        db.session.commit()
        # Associate the current admin as an owner of the new business
        new_business.owners.append(admin)
        db.session.commit()
        return jsonify({'message': 'Business created', 'id': new_business.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Получение всех бизнесов владельца
@admin_bp.route('/businesses', methods=['GET'])
@owner_required
def get_businesses():
    admin = get_current_admin()
    businesses = Business.query.filter(Business.owners.any(id=admin.id)).all()
    return jsonify([{
        'id': b.id,
        'name': b.name
    } for b in businesses])

# Обновление бизнеса
@admin_bp.route('/businesses/<int:business_id>', methods=['PUT'])
@owner_required
def update_business(business_id):
    admin = get_current_admin()
    business = Business.query.filter(Business.id == business_id, Business.owners.any(id=admin.id)).first_or_404()
    
    data = request.get_json()
    if 'name' in data:
        if Business.query.filter(Business.name == data['name'], Business.id != business_id).first():
            return jsonify({'error': 'Business name already exists'}), 400
        business.name = data['name']
    
    db.session.commit()
    return jsonify({'message': 'Business updated'})

# Удаление бизнеса (каскадное)
@admin_bp.route('/businesses/<int:business_id>', methods=['DELETE'])
@owner_required
def delete_business(business_id):
    admin = get_current_admin()
    business = Business.query.filter(Business.id == business_id, Business.owners.any(id=admin.id)).first_or_404()
    
    # Проверка связанных сущностей
    if len(business.branches) > 0:
        return jsonify({'error': 'Delete branches first'}), 400
    
    db.session.delete(business)
    db.session.commit()
    return jsonify({'message': 'Business deleted'})

# -------------------- Branch Routes --------------------
@admin_bp.route('/businesses/<int:business_id>/branches', methods=['POST'])
@owner_required
def create_branch(business_id):
    admin = get_current_admin()
    # Check if admin is an owner of the business
    business = Business.query.filter(Business.id == business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    try:
        new_branch = Branch(
            name=data['name'],
            business_id=business_id,
            locality=data['locality'],
            address=data['address'],
            phone_number=data['phone_number'],
            start_work_hour=time.fromisoformat(data['start_work_hour']),
            end_work_hour=time.fromisoformat(data['end_work_hour'])
        )
        db.session.add(new_branch)
        db.session.commit()
        # Optionally associate managers if provided
        manager_ids = data.get('manager_ids', [])
        for manager_id in manager_ids:
            manager = Admin.query.filter_by(id=manager_id, role='manager').first()
            if manager:
                new_branch.managers.append(manager)
        db.session.commit()
        return jsonify({'message': 'Branch created', 'id': new_branch.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# Получение всех филиалов бизнеса
@admin_bp.route('/businesses/<int:business_id>/branches', methods=['GET'])
@owner_required
def get_branches(business_id):
    admin = get_current_admin()
    branches = Branch.query.filter_by(business_id=business_id).all()
    return jsonify([{
        'id': b.id,
        'name': b.name,
        'locality': b.locality,
        'address': b.address,
        'phone_number': b.phone_number,
        'start_work_hour': b.start_work_hour.isoformat(),
        'end_work_hour': b.end_work_hour.isoformat(),
        'workers_count': len(b.workers)
    } for b in branches])


# Обновление филиала
@admin_bp.route('/branches/<int:branch_id>', methods=['PUT'])
@manager_or_owner_required
def update_branch(branch_id):
    error = check_branch_access(branch_id)
    if error: return error
    
    branch = Branch.query.get_or_404(branch_id)
    data = request.get_json()
    
    # Валидация времени работы
    if 'start_work_hour' in data and 'end_work_hour' in data:
        start = time.fromisoformat(data['start_work_hour'])
        end = time.fromisoformat(data['end_work_hour'])
        if start >= end:
            return jsonify({'error': 'Invalid work hours'}), 400
        
    # Обновление полей
    for field in ['name', 'locality', 'address', 'phone_number']:
        if field in data:
            setattr(branch, field, data[field])
    # Convert time strings to time objects for start_work_hour and end_work_hour
    if 'start_work_hour' in data:
        branch.start_work_hour = time.fromisoformat(data['start_work_hour'])
    if 'end_work_hour' in data:
        branch.end_work_hour = time.fromisoformat(data['end_work_hour'])
    
    db.session.commit()
    return jsonify({'message': 'Branch updated'})


# Удаление филиала
@admin_bp.route('/branches/<int:branch_id>', methods=['DELETE'])
@manager_or_owner_required
def delete_branch(branch_id):
    error = check_branch_access(branch_id)
    if error: return error
    
    branch = Branch.query.get_or_404(branch_id)
    
    if len(branch.workers) > 0:
        return jsonify({'error': 'Delete workers first'}), 400
    
    db.session.delete(branch)
    db.session.commit()
    return jsonify({'message': 'Branch deleted'})

# -------------------- Position Routes --------------------
@admin_bp.route('/branches/<int:branch_id>/positions', methods=['POST'])
@manager_or_owner_required
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

# Получение всех позиций филиала
@admin_bp.route('/branches/<int:branch_id>/positions', methods=['GET'])
@manager_or_owner_required
def get_positions(branch_id):
    error = check_branch_access(branch_id)
    if error: return error
    
    positions = Position.query.filter_by(branch_id=branch_id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'workers_count': len(p.workers)
    } for p in positions])

# Обновление позиции
@admin_bp.route('/positions/<int:position_id>', methods=['PUT'])
@manager_or_owner_required
def update_position(position_id):
    position = Position.query.get_or_404(position_id)
    error = check_branch_access(position.branch_id)
    if error: return error
    
    data = request.get_json()
    if 'name' in data:
        if Position.query.filter_by(name=data['name'], branch_id=position.branch_id).first():
            return jsonify({'error': 'Position name exists'}), 400
        position.name = data['name']
    
    db.session.commit()
    return jsonify({'message': 'Position updated'})

# Удаление позиции
@admin_bp.route('/positions/<int:position_id>', methods=['DELETE'])
@manager_or_owner_required
def delete_position(position_id):
    position = Position.query.get_or_404(position_id)
    error = check_branch_access(position.branch_id)
    if error: return error
    
    if len(position.workers) > 0:
        return jsonify({'error': 'Reassign workers first'}), 400
    
    db.session.delete(position)
    db.session.commit()
    return jsonify({'message': 'Position deleted'})

# -------------------- Service Routes --------------------
@admin_bp.route('/branches/<int:branch_id>/services', methods=['POST'])
@manager_or_owner_required
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

# Получение всех услуг филиала
@admin_bp.route('/branches/<int:branch_id>/services', methods=['GET'])
@manager_or_owner_required
def get_services(branch_id):
    error = check_branch_access(branch_id)
    if error: return error
    
    services = Service.query.filter_by(branch_id=branch_id).all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'duration': s.duration,
        'price_options': len(s.service_costs)
    } for s in services])

# Обновление услуги
@admin_bp.route('/services/<int:service_id>', methods=['PUT'])
@manager_or_owner_required
def update_service(service_id):
    service = Service.query.get_or_404(service_id)
    error = check_branch_access(service.branch_id)
    if error: return error
    
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

# Удаление позиции
@admin_bp.route('/services/<int:service_id>', methods=['DELETE'])
@manager_or_owner_required
def delete_service(service_id):
    service = Service.query.get_or_404(service_id)
    error = check_branch_access(service.branch_id)
    if error: return error
    
    if len(service.service_costs) > 0:
        return jsonify({'error': 'Reassign services costs first'}), 400
    
    db.session.delete(service)
    db.session.commit()
    return jsonify({'message': 'Service deleted'})

# -------------------- ServiceCost Routes --------------------
@admin_bp.route('/services/<int:service_id>/costs', methods=['POST'])
@manager_or_owner_required
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

@admin_bp.route('/service-costs/<int:cost_id>', methods=['PUT'])
@manager_or_owner_required
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

@admin_bp.route('/service-costs/<int:cost_id>', methods=['DELETE'])
@manager_or_owner_required
def delete_service_cost(cost_id):
    cost = ServiceCost.query.get_or_404(cost_id)
    error = check_branch_access(cost.service.branch_id)
    if error:
        return error

    db.session.delete(cost)
    db.session.commit()
    return jsonify({'message': 'Service cost deleted'})

# -------------------- Manager Routes --------------------
@admin_bp.route('/managers', methods=['GET'])
@manager_or_owner_required
def get_managers():
    try:
        managers = Admin.query.filter_by(role='manager').all()
        return jsonify([{
            'id': manager.id,
            'name': manager.name,
            'email': manager.email,
            'branchId': manager.branch_id
        } for manager in managers]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/manager/branches', methods=['GET'])
@manager_or_owner_required 
def get_manager_branches():
    try:
        current_user = g.current_user
        if current_user.branch_id:
            branch = Branch.query.get(current_user.branch_id)
            if branch:
                business = Business.query.get(branch.business_id)
                return jsonify([{
                    'id': branch.id,
                    'name': branch.name,
                    'locality': branch.locality,
                    'address': branch.address,
                    'businessName': business.name if business else ''
                }]), 200
        return jsonify([]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@admin_bp.route('/branches/<int:branch_id>/workers', methods=['GET'])
@manager_or_owner_required
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

@admin_bp.route('/workers/<int:worker_id>', methods=['GET'])
@manager_or_owner_required
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

@admin_bp.route('/workers/<int:worker_id>', methods=['PUT'])
@manager_or_owner_required
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

@admin_bp.route('/workers/<int:worker_id>', methods=['DELETE'])
@manager_or_owner_required
def delete_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error

    # Check if worker has work hours
    if len(worker.work_hours) > 0:
        return jsonify({'error': 'Delete work hours first'}), 400

    db.session.delete(worker)
    db.session.commit()
    return jsonify({'message': 'Worker deleted'})

# Управление рабочими часами
@admin_bp.route('/workers/<int:worker_id>/work-hours', methods=['POST', 'GET'])
@manager_or_owner_required
def manage_work_hours(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            # Проверка формата даты и времени
            date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            start = datetime.strptime(data['start_work_hour'], '%H:%M').time()
            end = datetime.strptime(data['end_work_hour'], '%H:%M').time()
            
            if start >= end:
                return jsonify({'error': 'Invalid time range'}), 400
                
            # Проверка на дублирование
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

# Обновление/удаление рабочих часов
@admin_bp.route('/work-hours/<int:work_hour_id>', methods=['PUT', 'DELETE'])
@manager_or_owner_required
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
    
@admin_bp.route('/workers/<int:worker_id>/batch-work-hours', methods=['POST'])
@manager_or_owner_required
def add_batch_work_hours(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    error = check_branch_access(worker.branch_id)
    if error:
        return error
    
    data = request.get_json()
    try:
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        days_of_week = data.get('days_of_week', [0,1,2,3,4]) # 0-понедельник
        
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() in days_of_week:
                # Проверка существующей записи
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
