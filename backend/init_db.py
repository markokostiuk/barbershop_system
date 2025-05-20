import sys
import os

# Add the backend directory to sys.path for imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from models import db, Admin
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    db.create_all()

    # Check if developer admin exists
    developer = Admin.query.filter_by(email='developer@example.com').first()
    if not developer:
        dev_admin = Admin(
            email='developer@example.com',
            password=generate_password_hash('devpassword'),
            role='developer',
            name='default-developer'
        )
        db.session.add(dev_admin)
        db.session.commit()
        print("Default developer admin created.")
    else:
        print("Developer admin already exists.")
    
    owner = Admin.query.filter_by(email='initial_owner@example.com').first()
    if not owner:
        owner_admin = Admin(
            email='initial_owner@example.com',
            password=generate_password_hash('ownpassword'),
            role='owner',
            name='initial-owner'
        )
        db.session.add(owner_admin)
        db.session.commit()
        print("Default owner_admin created.")
    else:
        print("Developer owner_admin already exists.")
