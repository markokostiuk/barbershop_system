from . import db

class Position(db.Model):
    __tablename__ = 'positions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)

    workers = db.relationship('Worker', backref='position', lazy=True)
    service_costs = db.relationship('ServiceCost', backref='position', lazy=True)
