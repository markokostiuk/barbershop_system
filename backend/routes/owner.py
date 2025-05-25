from flask import Blueprint, request, jsonify, render_template
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from functools import wraps
from models import db, Business, Admin, Branch, Position, Service, ServiceCost, Worker, WorkerWorkHours
from datetime import time, datetime, timedelta
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import verify_jwt_in_request

owner_bp = Blueprint('owner', __name__)

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

def check_branch_access(branch_id):
    admin = get_current_admin()
    # Check if admin owns the business that the branch belongs to
    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404
    if not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this branch'}), 403
    return None


@owner_bp.route('/register', methods=['POST'])
@owner_required
def register_manager():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = 'manager'

    if not email or not password or not name:
        return jsonify({'error': 'Email, password, and name are required'}), 400

    try:
        verify_jwt_in_request()
        current_admin = get_current_admin()
        if not current_admin:
            return jsonify({'error': 'Invalid token or admin not found'}), 401
    except Exception as e:
        return jsonify({'error': f'Invalid token: {str(e)}'}), 401

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

# -------------------- Business Routes --------------------
@owner_bp.route('/businesses', methods=['POST'])
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

@owner_bp.route('/businesses', methods=['GET'])
@owner_required
def get_businesses():
    admin = get_current_admin()
    businesses = Business.query.filter(Business.owners.any(id=admin.id)).all()
    return jsonify([{
        'id': b.id,
        'name': b.name
    } for b in businesses])

@owner_bp.route('/businesses/<int:business_id>', methods=['PUT'])
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

@owner_bp.route('/businesses/<int:business_id>', methods=['DELETE'])
@owner_required
def delete_business(business_id):
    admin = get_current_admin()
    business = Business.query.filter(Business.id == business_id, Business.owners.any(id=admin.id)).first_or_404()

    # Check for related entities
    if len(business.branches) > 0:
        return jsonify({'error': 'Delete branches first'}), 400

    db.session.delete(business)
    db.session.commit()
    return jsonify({'message': 'Business deleted'})

# -------------------- Branch Routes --------------------
@owner_bp.route('/businesses/<int:business_id>/branches', methods=['POST'])
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

@owner_bp.route('/businesses/<int:business_id>/branches', methods=['GET'])
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
        'end_work_hour': b.end_work_hour.isoformat()
    } for b in branches])

@owner_bp.route('/branches/<int:branch_id>', methods=['PUT'])
@owner_required
def update_branch(branch_id):
    error = check_branch_access(branch_id)
    if error:
        return error

    branch = Branch.query.get_or_404(branch_id)
    data = request.get_json()
    # Validate work hours
    if 'start_work_hour' in data and 'end_work_hour' in data:
        start = time.fromisoformat(data['start_work_hour'])
        end = time.fromisoformat(data['end_work_hour'])
        if start >= end:
            return jsonify({'error': 'Invalid work hours'}), 400

    # Update fields
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

@owner_bp.route('/branches/<int:branch_id>', methods=['DELETE'])
@owner_required
def delete_branch(branch_id):
    error = check_branch_access(branch_id)
    if error:
        return error

    branch = Branch.query.get_or_404(branch_id)

    if len(branch.workers) > 0:
        return jsonify({'error': 'Delete workers first'}), 400

    db.session.delete(branch)
    db.session.commit()
    return jsonify({'message': 'Branch deleted'})


@owner_bp.route('/managers', methods=['GET'])
@owner_required
def get_managers():
    try:
        managers = Admin.query.filter_by(role='manager').all()
        return jsonify([
            {
                'id': manager.id,
                'name': manager.name,
                'email': manager.email,
                'branchId': manager.branch_id if manager.branch_id else None
            }
            for manager in managers
        ]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Assign manager to branch
@owner_bp.route('/branches/<int:branch_id>/managers/<int:manager_id>', methods=['POST'])
@owner_required
def assign_manager_to_branch(branch_id, manager_id):
    admin = get_current_admin()
    if not admin:
        return jsonify({'error': 'Invalid admin'}), 401

    branch = Branch.query.get_or_404(branch_id)
    if not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400

    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this branch'}), 403

    manager = Admin.query.filter_by(id=manager_id, role='manager').first()
    if not manager:
        return jsonify({'error': 'Manager not found'}), 404

    # Assign branch to manager (one branch per manager)
    manager.branch = branch
    db.session.commit()
    return jsonify({'message': 'Manager assigned to branch'}), 200

# Delete manager
@owner_bp.route('/managers/<int:manager_id>', methods=['DELETE'])
@owner_required
def delete_manager(manager_id):
    admin = get_current_admin()
    if not admin:
        return jsonify({'error': 'Invalid admin'}), 401

    manager = Admin.query.filter_by(id=manager_id, role='manager').first()
    if not manager:
        return jsonify({'error': 'Manager not found'}), 404

    # Check if manager belongs to a business owned by admin
    if manager.branch:
        branch = Branch.query.get(manager.branch_id)
        if not branch or not branch.business_id:
            return jsonify({'error': 'Branch business not set'}), 400
        business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
        if not business:
            return jsonify({'error': 'Access denied to this manager'}), 403

    db.session.delete(manager)
    db.session.commit()
    return jsonify({'message': 'Manager deleted'}), 200

@owner_bp.route('/managers/<int:manager_id>', methods=['PUT'])
@owner_required
def update_manager(manager_id):
    admin = get_current_admin()
    manager = Admin.query.get_or_404(manager_id)

    data = request.get_json()
    if 'name' in data:
        manager.name = data['name']

    db.session.commit()
    return jsonify({'message': 'Business updated'})


# New routes for managing positions, services, and service costs

from flask import request, jsonify
from models import Position, Service, ServiceCost

# Positions CRUD
@owner_bp.route('/branches/<int:branch_id>/positions', methods=['GET'])
@owner_required
def get_positions(branch_id):
    admin = get_current_admin()
    # Check branch ownership
    branch = Branch.query.get_or_404(branch_id)
    if not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this branch'}), 403

    positions = Position.query.filter_by(branch_id=branch_id).all()
    return jsonify([{'id': p.id, 'name': p.name} for p in positions])

@owner_bp.route('/branches/<int:branch_id>/positions', methods=['POST'])
@owner_required
def create_position(branch_id):
    admin = get_current_admin()
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Position name is required'}), 400

    branch = Branch.query.get_or_404(branch_id)
    if not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this branch'}), 403

    new_position = Position(name=name, branch_id=branch_id)
    db.session.add(new_position)
    db.session.commit()
    return jsonify({'message': 'Position created', 'id': new_position.id}), 201

@owner_bp.route('/positions/<int:position_id>', methods=['PUT'])
@owner_required
def update_position(position_id):
    admin = get_current_admin()
    position = Position.query.get_or_404(position_id)
    branch = Branch.query.get(position.branch_id)
    if not branch or not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this position'}), 403

    data = request.get_json()
    name = data.get('name')
    if name:
        position.name = name
        db.session.commit()
        return jsonify({'message': 'Position updated'})
    else:
        return jsonify({'error': 'Position name is required'}), 400

@owner_bp.route('/positions/<int:position_id>', methods=['DELETE'])
@owner_required
def delete_position(position_id):
    admin = get_current_admin()
    position = Position.query.get_or_404(position_id)
    branch = Branch.query.get(position.branch_id)
    if not branch or not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this position'}), 403

    db.session.delete(position)
    db.session.commit()
    return jsonify({'message': 'Position deleted'})

# Services CRUD
@owner_bp.route('/branches/<int:branch_id>/services', methods=['GET'])
@owner_required
def get_services(branch_id):
    admin = get_current_admin()
    branch = Branch.query.get_or_404(branch_id)
    if not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this branch'}), 403

    services = Service.query.filter_by(branch_id=branch_id).all()
    return jsonify([{'id': s.id, 'name': s.name, 'duration': s.duration} for s in services])

@owner_bp.route('/branches/<int:branch_id>/services', methods=['POST'])
@owner_required
def create_service(branch_id):
    admin = get_current_admin()
    data = request.get_json()
    name = data.get('name')
    duration = data.get('duration')
    if not name or duration is None:
        return jsonify({'error': 'Service name and duration are required'}), 400

    branch = Branch.query.get_or_404(branch_id)
    if not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this branch'}), 403

    new_service = Service(name=name, duration=duration, branch_id=branch_id)
    db.session.add(new_service)
    db.session.commit()
    return jsonify({'message': 'Service created', 'id': new_service.id}), 201

@owner_bp.route('/services/<int:service_id>', methods=['PUT'])
@owner_required
def update_service(service_id):
    admin = get_current_admin()
    service = Service.query.get_or_404(service_id)
    branch = Branch.query.get(service.branch_id)
    if not branch or not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this service'}), 403

    data = request.get_json()
    name = data.get('name')
    duration = data.get('duration')
    if name:
        service.name = name
    if duration is not None:
        service.duration = duration
    db.session.commit()
    return jsonify({'message': 'Service updated'})

@owner_bp.route('/services/<int:service_id>', methods=['DELETE'])
@owner_required
def delete_service(service_id):
    admin = get_current_admin()
    service = Service.query.get_or_404(service_id)
    branch = Branch.query.get(service.branch_id)
    if not branch or not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this service'}), 403

    db.session.delete(service)
    db.session.commit()
    return jsonify({'message': 'Service deleted'})

# ServiceCosts CRUD
@owner_bp.route('/branches/<int:branch_id>/service_costs', methods=['GET'])
@owner_required
def get_service_costs_by_branch(branch_id):
    admin = get_current_admin()
    branch = Branch.query.get_or_404(branch_id)
    if not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this branch'}), 403

    positions = Position.query.filter_by(branch_id=branch_id).all()
    position_ids = [p.id for p in positions]

    service_costs = ServiceCost.query.filter(ServiceCost.position_id.in_(position_ids)).all()

    result = {}
    for sc in service_costs:
        pos_id = sc.position_id
        if pos_id not in result:
            result[pos_id] = []
        result[pos_id].append({
            'id': sc.id,
            'service_id': sc.service_id,
            'price': sc.price
        })

    response = []
    for position in positions:
        response.append({
            'position_id': position.id,
            'position_name': position.name,
            'service_costs': result.get(position.id, [])
        })

    return jsonify(response)


@owner_bp.route('/positions/<int:position_id>/service_costs', methods=['POST'])
@owner_required
def create_service_cost(position_id):
    admin = get_current_admin()
    data = request.get_json()
    service_id = data.get('service_id')
    price = data.get('price')
    if not service_id or price is None:
        return jsonify({'error': 'Service ID and price are required'}), 400

    position = Position.query.get_or_404(position_id)
    branch = Branch.query.get(position.branch_id)
    if not branch or not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this position'}), 403

    new_service_cost = ServiceCost(position_id=position_id, service_id=service_id, price=price)
    db.session.add(new_service_cost)
    db.session.commit()
    return jsonify({'message': 'Service cost created', 'id': new_service_cost.id}), 201

@owner_bp.route('/service_costs/<int:service_cost_id>', methods=['PUT'])
@owner_required
def update_service_cost(service_cost_id):
    admin = get_current_admin()
    service_cost = ServiceCost.query.get_or_404(service_cost_id)
    position = Position.query.get(service_cost.position_id)
    branch = Branch.query.get(position.branch_id)
    if not branch or not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this service cost'}), 403

    data = request.get_json()
    price = data.get('price')
    if price is not None:
        service_cost.price = price
        db.session.commit()
        return jsonify({'message': 'Service cost updated'})
    else:
        return jsonify({'error': 'Price is required'}), 400

@owner_bp.route('/service_costs/<int:service_cost_id>', methods=['DELETE'])
@owner_required
def delete_service_cost(service_cost_id):
    admin = get_current_admin()
    service_cost = ServiceCost.query.get_or_404(service_cost_id)
    position = Position.query.get(service_cost.position_id)
    branch = Branch.query.get(position.branch_id)
    if not branch or not branch.business_id:
        return jsonify({'error': 'Branch business not set'}), 400
    business = Business.query.filter(Business.id == branch.business_id, Business.owners.any(id=admin.id)).first()
    if not business:
        return jsonify({'error': 'Access denied to this service cost'}), 403

    db.session.delete(service_cost)
    db.session.commit()
    return jsonify({'message': 'Service cost deleted'})

# -------------------- Reports Endpoints --------------------

from sqlalchemy import func
from models import Appointment, Service

@owner_bp.route('/reports/revenue', methods=['GET'])
@owner_required
def get_revenue_report():
    admin = get_current_admin()
    if not admin:
        return jsonify({'error': 'Unauthorized'}), 401

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    business_id = request.args.get('business_id', type=int)
    branch_id = request.args.get('branch_id', type=int)

    try:
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    businesses = Business.query.filter(Business.owners.any(id=admin.id)).all()
    business_ids = [b.id for b in businesses]

    if business_id and business_id not in business_ids:
        return jsonify({'error': 'Access denied to this business'}), 403

    query = db.session.query(func.sum(ServiceCost.price)).join(ServiceCost.position).join(Position.branch).join(Branch.business).join(Appointment).filter(Appointment.service_id == Service.id)

    query = query.filter(Business.id.in_(business_ids)).filter(Appointment.status != 'Canceled')

    if business_id:
        query = query.filter(Business.id == business_id)
    if branch_id:
        query = query.filter(Branch.id == branch_id)
    if start_date:
        query = query.filter(Appointment.datetime >= start_date)
    if end_date:
        query = query.filter(Appointment.datetime <= end_date)

    total_revenue = query.scalar() or 0

    return jsonify({'total_revenue': total_revenue})

@owner_bp.route('/reports/clients', methods=['GET'])
@owner_required
def get_clients_report():
    admin = get_current_admin()
    if not admin:
        return jsonify({'error': 'Unauthorized'}), 401

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    business_id = request.args.get('business_id', type=int)
    branch_id = request.args.get('branch_id', type=int)

    try:
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    businesses = Business.query.filter(Business.owners.any(id=admin.id)).all()
    business_ids = [b.id for b in businesses]

    if business_id and business_id not in business_ids:
        return jsonify({'error': 'Access denied to this business'}), 403

    query = db.session.query(func.count(func.distinct(Appointment.customer_phone)))

    query = query.join(Branch, Appointment.branch_id == Branch.id).join(Business, Branch.business_id == Business.id)

    query = query.filter(Business.id.in_(business_ids)).filter(Appointment.status != 'Canceled')

    if business_id:
        query = query.filter(Business.id == business_id)
    if branch_id:
        query = query.filter(Appointment.branch_id == branch_id)
    if start_date:
        query = query.filter(Appointment.datetime >= start_date)
    if end_date:
        query = query.filter(Appointment.datetime <= end_date)

    total_clients = query.scalar() or 0

    return jsonify({'total_clients': total_clients})

@owner_bp.route('/reports/services', methods=['GET'])
@owner_required
def get_services_report():
    admin = get_current_admin()
    if not admin:
        return jsonify({'error': 'Unauthorized'}), 401

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    business_id = request.args.get('business_id', type=int)
    branch_id = request.args.get('branch_id', type=int)

    try:
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    businesses = Business.query.filter(Business.owners.any(id=admin.id)).all()
    business_ids = [b.id for b in businesses]

    if business_id and business_id not in business_ids:
        return jsonify({'error': 'Access denied to this business'}), 403

    query = db.session.query(
        Service.id,
        Service.name,
        func.count(Appointment.id).label('booking_count')
    ).join(Appointment).join(Branch, Appointment.branch_id == Branch.id).join(Business, Branch.business_id == Business.id)

    query = query.filter(Business.id.in_(business_ids)).filter(Appointment.status != 'Canceled')

    if business_id:
        query = query.filter(Business.id == business_id)
    if branch_id:
        query = query.filter(Appointment.branch_id == branch_id)
    if start_date:
        query = query.filter(Appointment.datetime >= start_date)
    if end_date:
        query = query.filter(Appointment.datetime <= end_date)

    query = query.group_by(Service.id).order_by(func.count(Appointment.id).desc())

    services = []
    for service_id, service_name, booking_count in query.all():
        services.append({
            'id': service_id,
            'name': service_name,
            'booking_count': booking_count
        })

    return jsonify(services)

