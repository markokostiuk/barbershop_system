import sys
import os


sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db
from routes.client import client_bp
from routes.auth import auth_bp
from routes.developer import developer_bp
from routes.owner import owner_bp
from routes.manager import manager_bp
from routes.worker import worker_bp

from flask_jwt_extended import JWTManager

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)
    app.config.from_object(Config)


    app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']

    jwt = JWTManager(app)

    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        print("Unauthorized access:", callback)
        return jsonify({'error': 'Missing or invalid Authorization header'}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        print("Invalid token:", callback)
        return jsonify({'error': 'Invalid token'}), 401

    db.init_app(app)

    app.register_blueprint(client_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(developer_bp, url_prefix='/developer')
    app.register_blueprint(owner_bp, url_prefix='/owner')
    app.register_blueprint(manager_bp, url_prefix='/manager')
    app.register_blueprint(worker_bp, url_prefix='/worker')

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True)
