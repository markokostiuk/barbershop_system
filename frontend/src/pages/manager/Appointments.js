import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Table, Button, Alert, Modal } from 'react-bootstrap';
import AdminNavbar from '../../components/Navbar';
import { getAppointments, updateAppointmentStatus } from '../../api/manager';

const statusOptions = ['Waiting', 'In-process', 'Finished', 'Canceled'];

function Appointments() {
  const role = localStorage.getItem('role');
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newStatus, setNewStatus] = useState('');


  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDateFilter(today);
    setEndDateFilter(today);
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const data = await getAppointments();

        data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        setAppointments(data);
        setFilteredAppointments(data);
      } catch (err) {
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [statusFilter, startDateFilter, endDateFilter, appointments]);

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (startDateFilter) {
      filtered = filtered.filter(app => app.datetime.slice(0, 10) >= startDateFilter);
    }

    if (endDateFilter) {
      filtered = filtered.filter(app => app.datetime.slice(0, 10) <= endDateFilter);
    }

    setFilteredAppointments(filtered);
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const setTodayFilter = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDateFilter(today);
    setEndDateFilter(today);
  };

  const openModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setNewStatus('');
  };

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    if (!selectedAppointment) return;
    try {
      await updateAppointmentStatus(selectedAppointment.id, newStatus);

      const updatedAppointments = appointments.map(app =>
        app.id === selectedAppointment.id ? { ...app, status: newStatus } : app
      );
      setAppointments(updatedAppointments);
      closeModal();
    } catch (err) {
      setError('Failed to update appointment status');
    }
  };

  return (
    <>
      <AdminNavbar role={role} />
      <Container className="mt-5">
        <h2>Appointments</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Row className="mb-3">
          <Col md={2}>
            <Form.Group controlId="statusFilter">
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {['All', ...statusOptions].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group controlId="startDateFilter">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDateFilter}
                onChange={e => setStartDateFilter(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group controlId="endDateFilter">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDateFilter}
                onChange={e => setEndDateFilter(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button variant="primary" onClick={setTodayFilter}>
              Сегодня
            </Button>
          </Col>
        </Row>
        {loading ? (
          <p>Loading appointments...</p>
        ) : filteredAppointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Customer Phone</th>
                <th>Worker Name</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(app => (
                <tr key={app.id}>
                  <td>{app.customer_name}</td>
                  <td>{app.customer_phone}</td>
                  <td>{app.worker_name}</td>
                  <td>{app.service_name}</td>
                  <td>{app.datetime.slice(0, 10)}</td>
                  <td>{new Date(app.datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td>{app.status}</td>
                  <td>
                    {app.status === 'Canceled' ? (
                      <Button variant="outline-secondary" size="sm" disabled>
                        Change
                      </Button>
                    ) : (
                      <Button variant="outline-primary" size="sm" onClick={() => openModal(app)}>
                        Change
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>

      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Change Appointment Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="newStatusSelect">
            <Form.Label>Select new status</Form.Label>
            <Form.Select value={newStatus} onChange={handleStatusChange}>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Appointments;
