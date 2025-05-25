from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models import db, Admin, Appointment, Worker, WorkerWorkHours
from datetime import datetime, date

worker_bp = Blueprint('worker', __name__)

def get_current_worker():
    try:
        worker_id = get_jwt_identity()
        return Worker.query.get(worker_id)
    except Exception as e:
        print(f"JWT identity error: {e}")
        return None

def worker_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        worker = get_current_worker()
        if not worker:
            return jsonify({'error': 'Worker access required'}), 403
        return f(*args, **kwargs)
    return decorated

@worker_bp.route('/appointments', methods=['GET'])
@worker_required
def get_worker_appointments():
    worker = get_current_worker()
    if not worker:
        return jsonify({'error': 'Unauthorized'}), 401

    appointments = Appointment.query.filter_by(worker_id=worker.id).all()

    result = []
    for appt in appointments:
        result.append({
            'id': appt.id,
            'status': appt.status,
            'datetime': appt.datetime.isoformat(),
            'customer_name': appt.customer_name,
            'customer_phone': appt.customer_phone,
            'worker_name': worker.name,
            'service_name': appt.service.name if appt.service else None
        })
    return jsonify(result)

@worker_bp.route('/work_schedule', methods=['GET'])
@worker_required
def get_worker_schedule():
    worker = get_current_worker()
    if not worker:
        return jsonify({'error': 'Unauthorized'}), 401

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    try:
        start_date = datetime.fromisoformat(start_date_str).date() if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str).date() if end_date_str else None
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    query = WorkerWorkHours.query.filter_by(worker_id=worker.id)

    if start_date:
        query = query.filter(WorkerWorkHours.date >= start_date)
    if end_date:
        query = query.filter(WorkerWorkHours.date <= end_date)

    query = query.order_by(WorkerWorkHours.date.asc())

    work_hours = query.all()

    result = []
    for wh in work_hours:
        result.append({
            'id': wh.id,
            'date': wh.date.isoformat(),
            'start_work_hour': wh.start_work_hour.strftime('%H:%M'),
            'end_work_hour': wh.end_work_hour.strftime('%H:%M')
        })

    return jsonify(result)
