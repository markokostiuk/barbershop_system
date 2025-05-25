from flask import Blueprint, jsonify, request
from collections import defaultdict
from datetime import datetime, timedelta, time
from models import db, Branch, Business, Worker, Service, ServiceCost, WorkerWorkHours, Appointment, Position

client_bp = Blueprint('client', __name__)

@client_bp.route('/cities/<int:id>', methods=['GET'])
def get_branches_by_locality(id):
    business = Business.query.filter_by(id=id).first()
    if not business:
        return jsonify({'error': 'Business not found'}), 404

    branches = Branch.query.filter_by(business_id=id).all()

    grouped = defaultdict(list)
    for branch in branches:
        grouped[branch.locality].append({
            'id': branch.id,
            'name': branch.name,
            'address': branch.address,
            'phone_number': branch.phone_number,
            'start_work_hour': branch.start_work_hour.strftime('%H:%M'),
            'end_work_hour': branch.end_work_hour.strftime('%H:%M')
        })

    return jsonify({
        'business_name': business.name,
        'branches': grouped
    })

@client_bp.route('/branches/<int:branch_id>/services/<int:service_id>/workers', methods=['GET'])
def get_workers_by_branch_and_service(branch_id, service_id):
    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    position_id = request.args.get('position_id', type=int)

    # Get all workers in the branch
    workers = Worker.query.filter_by(branch_id=branch_id).all()

    if position_id:
        # Filter workers by position_id if provided
        filtered_workers = [w for w in workers if w.position_id == position_id]
    else:
        # Get positions linked to the service via ServiceCost
        service_costs = ServiceCost.query.filter_by(service_id=service_id).all()
        position_ids_for_service = {sc.position_id for sc in service_costs}
        # Filter workers whose position is linked to the service
        filtered_workers = [w for w in workers if w.position_id in position_ids_for_service]

    result = []
    for w in filtered_workers:
        result.append({
            'id': w.id,
            'name': w.name,
            'position_id': w.position_id
        })

    return jsonify(result)

@client_bp.route('/branches/<int:branch_id>/workers', methods=['GET'])
def get_workers_by_branch(branch_id):
    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    workers = Worker.query.filter_by(branch_id=branch_id).all()
    result = []
    for w in workers:
        result.append({
            'id': w.id,
            'name': w.name,
            'position_id': w.position_id
        })
    return jsonify(result)

@client_bp.route('/workers/<int:worker_id>/services', methods=['GET'])
def get_services_by_worker(worker_id):
    worker = Worker.query.get(worker_id)
    if not worker:
        return jsonify({'error': 'Worker not found'}), 404

    # Get services linked to worker's position via ServiceCost
    service_costs = ServiceCost.query.filter_by(position_id=worker.position_id).all()
    services = []
    for sc in service_costs:
        service = Service.query.get(sc.service_id)
        if service:
            services.append({
                'id': service.id,
                'name': service.name,
                'duration': service.duration,
                'price': sc.price
            })
    return jsonify(services)

def get_time_slots(start_time, end_time, duration_minutes):
    slots = []
    current = datetime.combine(datetime.today(), start_time)
    end = datetime.combine(datetime.today(), end_time)
    delta = timedelta(minutes=duration_minutes)
    while current + delta <= end:
        slots.append(current.time().strftime('%H:%M'))
        current += delta
    return slots

@client_bp.route('/workers/<int:worker_id>/services/<int:service_id>/available_slots', methods=['GET'])
def get_available_slots(worker_id, service_id):
    worker = Worker.query.get(worker_id)
    if not worker:
        return jsonify({'error': 'Worker not found'}), 404

    service = Service.query.get(service_id)
    if not service:
        return jsonify({'error': 'Service not found'}), 404

    # Get work hours for the worker for the next 7 days
    today = datetime.today().date()
    now_time = datetime.now().time()
    end_date = today + timedelta(days=7)

    available_slots = defaultdict(list)

    for single_date in (today + timedelta(n) for n in range(8)):
        work_hours = WorkerWorkHours.query.filter_by(worker_id=worker_id, date=single_date).first()
        if not work_hours:
            continue

        # Get all appointments for this worker, service and date
        day_start = datetime.combine(single_date, time.min)
        day_end = datetime.combine(single_date, time.max)
        appointments = Appointment.query.filter(
            Appointment.worker_id == worker_id,
            Appointment.service_id == service_id,
            Appointment.datetime >= day_start,
            Appointment.datetime <= day_end,
            Appointment.status != 'Canceled'
        ).all()

        booked_slots = set()
        for appt in appointments:
            booked_slots.add(appt.datetime.time().strftime('%H:%M'))

        # Calculate all possible slots
        all_slots = get_time_slots(work_hours.start_work_hour, work_hours.end_work_hour, service.duration)

        # Filter out booked slots
        free_slots = [slot for slot in all_slots if slot not in booked_slots]

        # Filter out past time slots if the date is today
        if single_date == today:
            free_slots = [slot for slot in free_slots if datetime.strptime(slot, '%H:%M').time() > now_time]

        if free_slots:
            available_slots[single_date.strftime('%Y-%m-%d')] = free_slots

    return jsonify(available_slots)

@client_bp.route('/branches/<int:branch_id>/services_by_position', methods=['GET'])
def get_services_grouped_by_position(branch_id):
    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    # Get positions for the branch
    positions = Position.query.filter_by(branch_id=branch_id).all()
    position_ids = [p.id for p in positions]

    # Get service costs for these positions
    service_costs = ServiceCost.query.filter(ServiceCost.position_id.in_(position_ids)).all()

    # Group services by position
    result = {}
    for sc in service_costs:
        if sc.position_id not in result:
            result[sc.position_id] = []
        service = Service.query.get(sc.service_id)
        if service:
            result[sc.position_id].append({
                'id': service.id,
                'name': service.name,
                'duration': service.duration,
                'price': sc.price
            })

    # Prepare response grouped by position name
    response = []
    for position in positions:
        response.append({
            'position_id': position.id,
            'position_name': position.name,
            'services': result.get(position.id, [])
        })

    return jsonify(response)

@client_bp.route('/appointments', methods=['POST', 'OPTIONS'])
def create_appointment():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()
    required_fields = ['worker_id', 'service_id', 'datetime', 'customer_name', 'customer_phone', 'branch_id']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    worker = Worker.query.get(data['worker_id'])
    if not worker:
        return jsonify({'error': 'Worker not found'}), 404

    service = Service.query.get(data['service_id'])
    if not service:
        return jsonify({'error': 'Service not found'}), 404

    branch = Branch.query.get(data['branch_id'])
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    try:
        appointment_datetime = datetime.fromisoformat(data['datetime'])
    except ValueError:
        return jsonify({'error': 'Invalid datetime format'}), 400

    new_appointment = Appointment(
        worker_id=worker.id,
        service_id=service.id,
        datetime=appointment_datetime,
        customer_name=data['customer_name'],
        customer_phone=data['customer_phone'],
        branch_id=branch.id,
        status='Waiting'
    )
    db.session.add(new_appointment)
    db.session.commit()

    return jsonify({'message': 'Appointment created successfully', 'appointment_id': new_appointment.id})

@client_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    worker = Worker.query.get(appointment.worker_id)
    service = Service.query.get(appointment.service_id)
    branch = Branch.query.get(appointment.branch_id)
    service_cost = ServiceCost.query.filter_by(position_id=worker.position_id, service_id=appointment.service_id).first()


    return jsonify({
        'id': appointment.id,
        'worker': {'id': worker.id, 'name': worker.name} if worker else None,
        'service': {'id': service.id, 'name': service.name, 'duration': service.duration } if service else None,
        'branch': {'id': branch.id, 'name': branch.name, "locality":branch.locality, "address":branch.address} if branch else None,
        'datetime': appointment.datetime.isoformat(),
        'customer_name': appointment.customer_name,
        'customer_phone': appointment.customer_phone,
        'status': appointment.status,
        'price' : service_cost.price
    })

@client_bp.route('/appointments/<int:appointment_id>/cancel', methods=['PATCH', 'OPTIONS'])
def cancel_appointment(appointment_id):
    if request.method == 'OPTIONS':
        return '', 204

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    appointment.status = 'Canceled'
    db.session.commit()

    return jsonify({'message': 'Appointment canceled successfully'})

@client_bp.route('/appointments/<int:appointment_id>/reschedule', methods=['PATCH', 'OPTIONS'])
def reschedule_appointment(appointment_id):
    if request.method == 'OPTIONS':
        return '', 204

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'error': 'Appointment not found'}), 404

    data = request.get_json()
    new_datetime_str = data.get('datetime')
    if not new_datetime_str:
        return jsonify({'error': 'Missing new datetime'}), 400

    try:
        new_datetime = datetime.fromisoformat(new_datetime_str)
    except ValueError:
        return jsonify({'error': 'Invalid datetime format'}), 400

    appointment.datetime = new_datetime
    appointment.status = 'Waiting'
    db.session.commit()

    return jsonify({'message': 'Appointment rescheduled successfully'})
