from . import db
from . import business_owners

class Business(db.Model):
    __tablename__ = 'businesses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    owners = db.relationship('Admin', secondary=business_owners, back_populates='businesses')
    branches = db.relationship('Branch', backref='business', lazy=True, cascade='all, delete-orphan')
