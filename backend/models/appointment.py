from . import db

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.Enum('Waiting', 'In-process', 'Finished', 'Canceled', name='statuses'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    datetime = db.Column(db.DateTime, nullable=False)
    customer_name = db.Column(db.String(40), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
