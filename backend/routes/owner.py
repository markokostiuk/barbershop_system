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
        'end_work_hour': b.end_work_hour.isoformat(),
        'workers_count': len(b.workers)
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



# @owner_bp.route('/managers', methods=['GET'])
# @owner_required
# def get_managers():
#     try:
#         managers = Admin.query.filter_by(role='manager').all()
#         return jsonify([{
#             'id': manager.id,
#             'name': manager.name,
#             'email': manager.email
#         } for manager in managers]), 200
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

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
                'branches': [
                    {
                        'id': branch.id,
                        'name': branch.name,
                        'locality': branch.locality,
                        'address': branch.address,
                        'phone_number': branch.phone_number,
                        'work_hours': f"{branch.start_work_hour} - {branch.end_work_hour}"
                    } for branch in manager.branches
                ]
            }
            for manager in managers
        ]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

