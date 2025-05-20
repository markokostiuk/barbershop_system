from . import db

class Branch(db.Model):
    __tablename__ = 'branches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    locality = db.Column(db.String(100), nullable=False)  # населенный пункт
    address = db.Column(db.String(200), nullable=False)  # адрес
    phone_number = db.Column(db.String(20), nullable=False)
    start_work_hour = db.Column(db.Time, nullable=False)
    end_work_hour = db.Column(db.Time, nullable=False)
    workers = db.relationship('Worker', backref='branch', lazy=True)
    positions = db.relationship('Position', backref='branch', lazy=True)
    services = db.relationship('Service', backref='branch', lazy=True)
    managers = db.relationship('Admin', secondary='branch_managers', back_populates='branches')
