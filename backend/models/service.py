from . import db

class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)

    service_costs = db.relationship('ServiceCost', backref='service', lazy=True)
    appointments = db.relationship('Appointment', backref='service', lazy=True)
