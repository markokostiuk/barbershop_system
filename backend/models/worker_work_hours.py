from . import db

class WorkerWorkHours(db.Model):
    __tablename__ = 'worker_work_hours'
    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_work_hour = db.Column(db.Time, nullable=False)
    end_work_hour = db.Column(db.Time, nullable=False)
