from . import db
# from . import branch_managers
from . import business_owners

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum('owner', 'manager', 'developer', name='admin_roles'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    businesses = db.relationship('Business', secondary=business_owners, back_populates='owners')
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    branch = db.relationship('Branch', back_populates='managers')
