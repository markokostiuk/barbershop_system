import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Accordion,
  Button,
  Container,
  Alert,
  Spinner,
  Modal,
  Form,
  Row,
  Col
} from 'react-bootstrap';
import { getCitiesBranches, getWorkersByBranch, getServicesByWorker, getAvailableSlots, createAppointment, getServicesGroupedByPosition, getWorkersForServiceAndBranch } from '../../api/client';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function Appointments() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [citiesBranches, setCitiesBranches] = useState({});
  const [expandedCity, setExpandedCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [businessName, setBusinessName] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  // Flow selection: 1 = master first, 2 = service first
  const [flowType, setFlowType] = useState(null);

  // Selection state
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotsForDate, setSlotsForDate] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // For flow 2: services grouped by position
  const [servicesByPosition, setServicesByPosition] = useState([]);
  const [workersForService, setWorkersForService] = useState([]);

  // Appointment form data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    loadCitiesBranches(id);
  }, [id]);

  const loadCitiesBranches = async (id) => {
    setLoading(true);
    setError('');
    try {
      const data = await getCitiesBranches(id);
      setBusinessName(data.business_name);
      setCitiesBranches(data.branches);
    } catch (err) {
      setError('Failed to load cities and branches');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCity = (city) => {
    setExpandedCity(prev => (prev === city ? null : city));
  };

  // Modal handlers
  const openModal = (branch) => {
    setSelectedBranch(branch);
    setModalStep(1);
    setFlowType(null);
    setSelectedWorker(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setWorkers([]);
    setServices([]);
    setAvailableSlots({});
    setSlotsForDate([]);
    setServicesByPosition([]);
    setWorkersForService([]);
    setCustomerName('');
    setCustomerPhone('');
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Flow selection handler
  const handleFlowSelect = async (flow) => {
    setFlowType(flow);
    setModalStep(2);
    setSelectedWorker(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setWorkers([]);
    setServices([]);
    setAvailableSlots({});
    setSlotsForDate([]);
    setServicesByPosition([]);
    setWorkersForService([]);
    setFormError('');
    setFormSuccess('');

    if (flow === 1) {
      // Flow 1: fetch workers for branch
      fetchWorkers(selectedBranch.id);
    } else if (flow === 2) {
      // Flow 2: fetch services grouped by position for branch
      try {
        const data = await getServicesGroupedByPosition(selectedBranch.id);
        setServicesByPosition(data);
      } catch (err) {
        setFormError('Failed to load services grouped by position');
      }
    }
  };

  // Fetch workers for branch (flow 1)
  const fetchWorkers = async (branchId) => {
    try {
      const data = await getWorkersByBranch(branchId);
      setWorkers(data);
    } catch (err) {
      setFormError('Failed to load workers');
    }
  };

  // On worker select (flow 1)
  const handleWorkerSelect = async (workerId) => {
    setSelectedWorker(workerId);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setServices([]);
    setAvailableSlots({});
    setSlotsForDate([]);
    try {
      const data = await getServicesByWorker(workerId);
      setServices(data);
      setModalStep(3);
    } catch (err) {
      setFormError('Failed to load services');
    }
  };

  // On service select (flow 1)
  const handleServiceSelect = async (serviceId) => {
    setSelectedService(serviceId);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots({});
    setSlotsForDate([]);
    try {
      const data = await getAvailableSlots(selectedWorker, serviceId);
      setAvailableSlots(data);
      setModalStep(4);
    } catch (err) {
      setFormError('Failed to load available slots');
    }
  };

  // On service select (flow 2)
  const handleServiceSelectFlow2 = async (serviceId, positionId) => {
    setSelectedService(serviceId);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots({});
    setSlotsForDate([]);
    setWorkersForService([]);
    try {
      const data = await getWorkersForServiceAndBranch(selectedBranch.id, serviceId, positionId);
      setWorkersForService(data);
      setModalStep(3);
    } catch (err) {
      setFormError('Failed to load workers for selected service');
    }
  };

  // On worker select (flow 2)
  const handleWorkerSelectFlow2 = async (workerId) => {
    setSelectedWorker(workerId);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots({});
    setSlotsForDate([]);
    try {
      const data = await getAvailableSlots(workerId, selectedService);
      setAvailableSlots(data);
      setModalStep(4);
    } catch (err) {
      setFormError('Failed to load available slots');
    }
  };

  // On date select from calendar
  const handleDateChange = (date) => {
    // Generate date string in local time to match availableSlots keys
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setSelectedDate(dateStr);
    setSlotsForDate(availableSlots[dateStr] || []);
    setSelectedSlot(null);
  };

  // On slot select
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setModalStep(5);
  };

  // Submit appointment

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!customerName || !customerPhone) {
      setFormError('Please fill in all fields');
      return;
    }
    try {
      const response = await createAppointment({
        worker_id: selectedWorker,
        service_id: selectedService,
        datetime: `${selectedDate}T${selectedSlot}:00`,
        customer_name: customerName,
        customer_phone: customerPhone,
        branch_id: selectedBranch.id
      });
      setFormSuccess('Appointment created successfully');
      setShowModal(false);
      navigate(`/appointment-confirmation/${response.appointment_id}`);
    } catch (err) {
      setFormError('Failed to create appointment');
    }
  };

  // Helper to tile calendar dates with available slots
  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      // Generate date string in local time to match availableSlots keys
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return !availableSlots.hasOwnProperty(dateStr);
    }
    return false;
  };

  return (
    <Container className="mt-4">
      <h2>{businessName ? `Cities & Branches for ${businessName}` : 'Cities & Branches'}</h2>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : Object.keys(citiesBranches).length === 0 ? (
        <Alert variant="info">There are no branches yet.</Alert>
      ) : (
        <Accordion activeKey={expandedCity}>
          {Object.entries(citiesBranches).map(([city, branches]) => (
            <Accordion.Item eventKey={city} key={city}>
              <Accordion.Header onClick={() => handleToggleCity(city)}>
                <b>{city}</b>
              </Accordion.Header>
              <Accordion.Body>
                {branches.length > 0 ? (
                  branches.map(branch => (
                    <div
                      key={branch.id}
                      className="d-flex justify-content-between align-items-center mb-3 border p-3 rounded"
                    >
                      <div>
                        <div><strong>{branch.name}</strong></div>
                        <div>Address: {branch.address}</div>
                        <div>Phone: {branch.phone_number}</div>
                        <div>Work hours: {branch.start_work_hour} - {branch.end_work_hour}</div>
                      </div>
                      <div>
                        <Button variant="primary" size="sm" className="me-2" onClick={() => openModal(branch)}>
                          Create an appointment
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No branches available.</p>
                )}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      <Modal show={showModal} onHide={closeModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Create an Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          {modalStep === 1 && (
            <>
              <h5>Select Flow</h5>
              <Button variant={flowType === 1 ? 'primary' : 'outline-primary'} className="m-1" onClick={() => handleFlowSelect(1)}>
                1. Select Master First
              </Button>
              <Button variant={flowType === 2 ? 'primary' : 'outline-primary'} className="m-1" onClick={() => handleFlowSelect(2)}>
                2. Select Service First
              </Button>
            </>
          )}
          {modalStep === 2 && flowType === 1 && (
            <>
              <h5>Select a Master</h5>
              {workers.length === 0 ? (
                <p>No masters available for this branch.</p>
              ) : (
                <div>
                  {workers.map(worker => (
                    <Button
                      key={worker.id}
                      variant={worker.id === selectedWorker ? 'primary' : 'outline-primary'}
                      className="m-1"
                      onClick={() => handleWorkerSelect(worker.id)}
                    >
                      {worker.name}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
          {modalStep === 2 && flowType === 2 && (
            <>
              <h5>Select a Service</h5>
              {servicesByPosition.length === 0 ? (
                <p>No services available for this branch.</p>
              ) : (
                servicesByPosition.map(position => (
                  <div key={position.position_id} className="mb-3">
                    <h6>{position.position_name}</h6>
                      {position.services.length === 0 ? (
                        <p>No services for this position.</p>
                      ) : (
                        position.services.map(service => (
                          <Button
                            key={service.id}
                            variant={service.id === selectedService ? 'primary' : 'outline-primary'}
                            className="m-1"
                            onClick={() => handleServiceSelectFlow2(service.id, position.position_id)}
                          >
                            {service.name} - {service.price} UAH - {service.duration} min
                          </Button>
                        ))
                      )}
                  </div>
                ))
              )}
            </>
          )}
          {modalStep === 3 && flowType === 1 && (
            <>
              <h5>Select a Service</h5>
              {services.length === 0 ? (
                <p>No services available for this master.</p>
              ) : (
                <div>
                  {services.map(service => (
                    <Button
                      key={service.id}
                      variant={service.id === selectedService ? 'primary' : 'outline-primary'}
                      className="m-1"
                      onClick={() => handleServiceSelect(service.id)}
                    >
                      {service.name} - {service.price} UAH - {service.duration} min
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
          {modalStep === 3 && flowType === 2 && (
            <>
              <h5>Select a Master</h5>
              {workersForService.length === 0 ? (
                <p>No masters available for this service.</p>
              ) : (
                <div>
                  {workersForService.map(worker => (
                    <Button
                      key={worker.id}
                      variant={worker.id === selectedWorker ? 'primary' : 'outline-primary'}
                      className="m-1"
                      onClick={() => handleWorkerSelectFlow2(worker.id)}
                    >
                      {worker.name}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
          {modalStep === 4 && (
            <>
              <h5>Select a Date</h5>
              <Calendar
                onChange={handleDateChange}
                tileDisabled={tileDisabled}
                value={selectedDate ? new Date(selectedDate) : null}
              />
              {selectedDate && (
                <div className="mt-3">
                  <h6>Available Slots</h6>
                  {slotsForDate.length === 0 ? (
                    <p>No slots available for this date.</p>
                  ) : (
                    slotsForDate.map(slot => (
                      <Button
                        key={slot}
                        variant={slot === selectedSlot ? 'primary' : 'outline-primary'}
                        className="m-1"
                        onClick={() => handleSlotSelect(slot)}
                      >
                        {slot}
                      </Button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
          {modalStep === 5 && (
            <>
              <h5>Enter Appointment Details</h5>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="customerName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="customerPhone">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  Confirm Appointment
                </Button>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Appointments;
