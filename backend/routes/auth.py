from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from models import Admin, Worker
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    admin = Admin.query.filter_by(email=email).first()
    worker = Worker.query.filter_by(email=email).first()
    if admin:
        if check_password_hash(admin.password, password):
            access_token = create_access_token(identity=str(admin.id), expires_delta=timedelta(minutes=30))
            return jsonify({'access_token': access_token, 'role': admin.role, 'id': admin.id}), 200
        else:
            return jsonify({'error': 'Invalid password'}), 401
    elif worker:
        if check_password_hash(worker.password, password):
            access_token = create_access_token(identity=str(worker.id), expires_delta=timedelta(minutes=30))
            return jsonify({'access_token': access_token, 'role': 'worker', 'id': worker.id}), 200
        else:
            return jsonify({'error': 'Invalid password'}), 401
    else:
        return jsonify({'error': 'User not found'}), 404
