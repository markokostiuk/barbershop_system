from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models import db, Admin
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError

developer_bp = Blueprint('developer', __name__)

def get_current_admin():
    try:
        admin_id = get_jwt_identity()
        return Admin.query.get(admin_id)
    except Exception as e:
        print(f"JWT identity error: {e}")
        return None

def developer_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        admin = get_current_admin()
        if admin.role != 'developer':
            return jsonify({'error': 'Developer access required'}), 403
        return f(*args, **kwargs)
    return decorated

@developer_bp.route('/register/owner', methods=['POST'])
@developer_required
def register_owner():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if Admin.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    hashed_password = generate_password_hash(password)
    new_admin = Admin(email=email, password=hashed_password, role='owner', name=name)

    try:
        db.session.add(new_admin)
        db.session.commit()
        return jsonify({'message': 'Owner registered successfully', 'id': new_admin.id}), 201
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500
