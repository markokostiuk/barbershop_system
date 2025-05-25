import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Table, Alert } from 'react-bootstrap';
import { getSchedule } from '../../api/worker'; // Assuming this API function exists or will be created
import Navbar from '../../components/Navbar';

function MySchedule() {
    const role = localStorage.getItem('role');
  const [workShifts, setWorkShifts] = useState([]);
  const [error, setError] = useState('');
  const [quickFilter, setQuickFilter] = useState('current_day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    applyQuickFilter(quickFilter);
  }, []);

  useEffect(() => {
    fetchWorkShifts();
  }, [startDate, endDate]);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const applyQuickFilter = (filter) => {
    const now = new Date();
    let start, end;

    switch (filter) {
      case 'current_day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start);
        break;
      case 'current_week':
        const day = now.getDay() || 7; // Monday=1,...Sunday=7
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day));
        break;
      case 'current_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start);
    }

    setQuickFilter(filter);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const fetchWorkShifts = async () => {
    setError('');
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await getSchedule(params);
      setWorkShifts(data);
    } catch (err) {
      setError('Failed to load work schedule');
    }
  };

  return (
    <>
      <Navbar role={role}/>
      <Container className="mt-5">
        <h2>My Schedule</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group controlId="quickFilter">
              <Form.Label>Quick Date Filter</Form.Label>
              <Form.Select
                value={quickFilter}
                onChange={e => applyQuickFilter(e.target.value)}
              >
                <option value="current_day">Current Day</option>
                <option value="current_week">Current Week</option>
                <option value="current_month">Current Month</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="startDate">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="endDate">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col>
            {workShifts.length === 0 ? (
              <p>No work shifts found.</p>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Start Work Hour</th>
                    <th>End Work Hour</th>
                  </tr>
                </thead>
                <tbody>
                  {workShifts.map(shift => (
                    <tr key={shift.id}>
                      <td>{shift.date}</td>
                      <td>{shift.start_work_hour}</td>
                      <td>{shift.end_work_hour}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default MySchedule;
