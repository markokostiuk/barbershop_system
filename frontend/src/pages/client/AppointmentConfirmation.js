import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Alert, Spinner, Card, Button, Modal, Form } from 'react-bootstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getAppointment, cancelAppointment, rescheduleAppointment, getAvailableSlots } from '../../api/client';

function AppointmentConfirmation() {
  const { appointmentId } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);


  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotsForDate, setSlotsForDate] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const data = await getAppointment(appointmentId);
        setAppointment(data);
      } catch (err) {
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, [appointmentId]);

  const fetchAvailableSlots = async (workerId, serviceId) => {
    try {
      const slots = await getAvailableSlots(workerId, serviceId);
      setAvailableSlots(slots);
    } catch (err) {
      setActionError('Failed to load available slots');
    }
  };

  const openRescheduleModal = () => {
    setActionError('');
    setActionSuccess('');
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlotsForDate([]);
    if (appointment && appointment.worker && appointment.service) {
      fetchAvailableSlots(appointment.worker.id, appointment.service.id);
    }
    setShowRescheduleModal(true);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
  };

  const handleDateChange = (date) => {

    setSelectedDate(date);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setSlotsForDate(availableSlots[dateStr] || []);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!selectedDate || !selectedSlot) {
      setActionError('Please select a date and time slot');
      return;
    }

    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const newDatetime = `${formattedDate}T${selectedSlot}:00`;
    try {
      console.log(newDatetime);
      await rescheduleAppointment(appointmentId, newDatetime);
      setActionSuccess('Appointment rescheduled successfully');
      setAppointment(prev => ({ ...prev, datetime: newDatetime, status: 'Waiting' }));
      setShowRescheduleModal(false);
    } catch (err) {
      setActionError('Failed to reschedule appointment');
    }
  };

  const handleCancel = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      await cancelAppointment(appointmentId);
      setActionSuccess('Appointment canceled successfully');
      setAppointment(prev => ({ ...prev, status: 'Canceled' }));
    } catch (err) {
      setActionError('Failed to cancel appointment');
    }
  };

  const openGoogleMaps = () => {
    if (!appointment || !appointment.branch) return;
    const city = appointment.branch.locality || '';
    const address = appointment.branch.address || '';
    const query = encodeURIComponent(`${city} ${address}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="warning">Appointment not found.</Alert>
      </Container>
    );
  }


  let statusMessage = '';
  if (appointment.status === 'Waiting' || appointment.status === 'Confirmed') {
    statusMessage = 'We are expecting you';
  } else if (appointment.status === 'Canceled') {
    statusMessage = 'Your visit has been canceled';
  } else if (appointment.status === 'Completed') {
    statusMessage = 'Please leave us a review';
  } else {
    statusMessage = `Status: ${appointment.status}`;
  }


  const appointmentDate = new Date(appointment.datetime);
  const startTimeStr = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const durationMinutes = appointment.service && appointment.service.duration ? appointment.service.duration : 0;
  let endTimeStr = '';
  if (durationMinutes > 0) {
    const endDate = new Date(appointmentDate.getTime() + durationMinutes * 60000);
    endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    endTimeStr = 'N/A';
  }

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: '480px' }} className="p-4">
        <h4 className="text-center mb-4">{statusMessage}</h4>

        <div className="mb-3">
          <h5>Appointment Information</h5>
          <p><strong>Client:</strong> {appointment.customer_name}</p>
          <p><strong>Your Phone Number:</strong> {appointment.customer_phone}</p>
        </div>

        <div className="mb-3">
          <h5>Service</h5>
          <p><strong>Master:</strong> {appointment.worker ? appointment.worker.name : 'N/A'}</p>
          <p><strong>Service:</strong> {appointment.service ? appointment.service.name : 'N/A'}</p>
          <p><strong>Price:</strong> {appointment.price ? appointment.price : 'N/A'} UAH</p>
          <p><strong>Date and Time:</strong> {appointmentDate.toLocaleDateString()} {startTimeStr} - {endTimeStr}</p>
        </div>

        <div className="mb-3">
          <h5>Location</h5>
          <p><strong>City:</strong> {appointment.branch ? appointment.branch.locality : 'N/A'}</p>
          <p><strong>Street:</strong> {appointment.branch ? appointment.branch.address : 'N/A'}</p>
          <p><strong>Branch:</strong> {appointment.branch ? appointment.branch.name : 'N/A'}</p>
          <Button variant="info" onClick={openGoogleMaps} className="mt-2 w-100">
            Build Route on Google Maps
          </Button>
        </div>

        <div className="d-flex justify-content-between mt-4">
          {appointment.status !== 'Canceled' && (
            <>
              <Button variant="danger" onClick={handleCancel}>Cancel Appointment</Button>
              <Button variant="secondary" onClick={openRescheduleModal}>Reschedule Appointment</Button>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to="/cities/1">
            <Button variant="primary">Back to Cities and Branches</Button>
          </Link>
        </div>

        <Modal show={showRescheduleModal} onHide={closeRescheduleModal} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Reschedule Appointment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleRescheduleSubmit}>
              <Form.Group className="mb-3" controlId="newDate">
                <Form.Label>Select New Date</Form.Label>
                <Calendar
                  onChange={handleDateChange}
                  tileDisabled={({ date, view }) => {
                    if (view === 'month') {
                      const year = date.getFullYear();
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const day = date.getDate().toString().padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      return !availableSlots.hasOwnProperty(dateStr);
                    }
                    return false;
                  }}
                  value={selectedDate || null}
                />
              </Form.Group>
              {selectedDate && (
                <Form.Group className="mb-3" controlId="newTime">
                  <Form.Label>Select New Time Slot</Form.Label>
                  <div>
                    {slotsForDate.length === 0 ? (
                      <p>No available slots for this date.</p>
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
                </Form.Group>
              )}
              <Button variant="primary" type="submit" disabled={!selectedSlot}>
                Confirm Reschedule
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </Card>
    </Container>
  );
}

export default AppointmentConfirmation;
