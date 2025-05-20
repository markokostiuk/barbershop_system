import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-123'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.path.abspath('instance'), 'database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    INITIAL_ADMIN_SECRET = 'initial-admin-secret-123'