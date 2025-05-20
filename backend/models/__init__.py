from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

business_owners = db.Table(
    'business_owners',
    db.Column('business_id', db.Integer, db.ForeignKey('businesses.id'), primary_key=True),
    db.Column('admin_id', db.Integer, db.ForeignKey('admins.id'), primary_key=True),
    extend_existing=True
)

# Removed branch_managers association table to enforce one branch per manager
# branch_managers = db.Table(
#     'branch_managers',
#     db.Column('branch_id', db.Integer, db.ForeignKey('branches.id'), primary_key=True),
#     db.Column('admin_id', db.Integer, db.ForeignKey('admins.id'), primary_key=True),
#     extend_existing=True
# )

from .business import Business
from .admin import Admin
from .branch import Branch
from .worker import Worker
from .position import Position
from .service import Service
from .service_cost import ServiceCost
from .worker_work_hours import WorkerWorkHours
from .appointment import Appointment
