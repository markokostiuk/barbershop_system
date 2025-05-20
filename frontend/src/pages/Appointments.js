import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Table, Button } from 'react-bootstrap';
import AdminNavbar from '../components/Navbar';

const dummyAppointments = [
  { id: 1, customer: 'John Doe', service: 'Haircut', date: '2024-06-01', time: '10:00', status: 'Confirmed' },
  { id: 2, customer: 'Jane Smith', service: 'Shave', date: '2024-06-02', time: '11:30', status: 'Pending' },
  { id: 3, customer: 'Bob Johnson', service: 'Haircut', date: '2024-06-03', time: '14:00', status: 'Cancelled' },
  { id: 4, customer: 'Alice Brown', service: 'Massage', date: '2024-06-04', time: '09:00', status: 'Confirmed' },
  { id: 5, customer: 'Tom Clark', service: 'Haircut', date: '2024-06-05', time: '15:30', status: 'Pending' },
];

const statusOptions = ['All', 'Confirmed', 'Pending', 'Cancelled'];

function Appointments() {
  const [appointments, setAppointments] = useState(dummyAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState(dummyAppointments);
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  useEffect(() => {
    filterAppointments();
  }, [statusFilter, startDateFilter, endDateFilter]);

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (startDateFilter) {
      filtered = filtered.filter(app => app.date >= startDateFilter);
    }

    if (endDateFilter) {
      filtered = filtered.filter(app => app.date <= endDateFilter);
    }

    setFilteredAppointments(filtered);
  };

  return (
    <div>
      <AdminNavbar role="manager" />
      <Container className="mt-5">
        <h2>Appointments</h2>
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group controlId="statusFilter">
              <Form.Label>Status</Form.Label>
              <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="startDateFilter">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDateFilter}
                onChange={e => setStartDateFilter(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="endDateFilter">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDateFilter}
                onChange={e => setEndDateFilter(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3} className="d-flex align-items-end">
            <Button variant="secondary" onClick={() => {
              setStatusFilter('All');
              setStartDateFilter('');
              setEndDateFilter('');
            }}>
              Clear Filters
            </Button>
          </Col>
        </Row>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map(app => (
                <tr key={app.id}>
                  <td>{app.customer}</td>
                  <td>{app.service}</td>
                  <td>{app.date}</td>
                  <td>{app.time}</td>
                  <td>{app.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No appointments found.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Container>
    </div>
  );
}

export default Appointments;
