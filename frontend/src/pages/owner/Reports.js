import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Table, Alert } from 'react-bootstrap';
import AdminNavbar from '../../components/Navbar';
import { getBusinesses, getBranches, getRevenueReport, getClientsReport, getServicesReport } from '../../api/owner';

function Reports() {
  const role = localStorage.getItem('role');
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [revenue, setRevenue] = useState(null);
  const [clients, setClients] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusinesses();
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      fetchBranches(selectedBusiness);
    } else {
      setBranches([]);
      setSelectedBranch('');
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if ((startDate && endDate) || (startDate === '' && endDate === '')) {
      fetchReports();
    }
  }, [selectedBusiness, selectedBranch, startDate, endDate]);

  const fetchBusinesses = async () => {
    try {
      const data = await getBusinesses();
      setBusinesses(data);
    } catch (err) {
      setError('Failed to load businesses');
    }
  };

  const fetchBranches = async (businessId) => {
    try {
      const data = await getBranches(businessId);
      setBranches(data);
    } catch (err) {
      setError('Failed to load branches');
    }
  };

  const fetchReports = async () => {
    try {
      setError('');
      const params = {
        start_date: startDate,
        end_date: endDate,
      };
      if (selectedBusiness) params.business_id = selectedBusiness;
      if (selectedBranch) params.branch_id = selectedBranch;

      const revenueResp = await getRevenueReport(params);
      setRevenue(revenueResp.total_revenue);

      const clientsResp = await getClientsReport(params);
      setClients(clientsResp.total_clients);

      const servicesResp = await getServicesReport(params);
      setServices(servicesResp);
    } catch (err) {
      setError('Failed to load reports');
    }
  };

  return (
    <>
      <AdminNavbar role={role} />
      <Container className="mt-5">
        <h2>Owner Reports</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group controlId="businessSelect">
              <Form.Label>Business</Form.Label>
              <Form.Select
                value={selectedBusiness}
                onChange={e => setSelectedBusiness(e.target.value)}
              >
                <option value="">All Businesses</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="branchSelect">
              <Form.Label>Branch</Form.Label>
              <Form.Select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                disabled={!branches.length}
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="quickFilter">
              <Form.Label>Quick Date Filter</Form.Label>
              <Form.Select
                value={quickFilter}
                onChange={e => {
                  const value = e.target.value;
                  setQuickFilter(value);
                  const now = new Date();
                  let start, end;


                  const formatDate = (date) => {
                    const y = date.getFullYear();
                    const m = (date.getMonth() + 1).toString().padStart(2, '0');
                    const d = date.getDate().toString().padStart(2, '0');
                    return `${y}-${m}-${d}`;
                  };

                  switch(value) {
                    case 'current_day':
                      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      end = new Date(start);
                      break;
                    case 'previous_day':
                      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                      end = new Date(start);
                      break;
                    case 'current_week':

                      const day = now.getDay() || 7;
                      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
                      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - day));
                      break;
                    case 'previous_week':
                      const dayPrev = now.getDay() || 7;
                      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayPrev - 6);
                      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayPrev);
                      break;
                    case 'current_month':
                      start = new Date(now.getFullYear(), now.getMonth(), 1);
                      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      break;
                    case 'previous_month':
                      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      end = new Date(now.getFullYear(), now.getMonth(), 0);
                      break;
                    case 'current_quarter':
                      const currentMonth = now.getMonth();
                      const quarterStartMonth = currentMonth - (currentMonth % 3);
                      start = new Date(now.getFullYear(), quarterStartMonth, 1);
                      end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
                      break;
                    case 'previous_quarter':
                      const currMonth = now.getMonth();
                      const prevQuarterStartMonth = currMonth - (currMonth % 3) - 3;
                      start = new Date(now.getFullYear(), prevQuarterStartMonth, 1);
                      end = new Date(now.getFullYear(), prevQuarterStartMonth + 3, 0);
                      break;
                    case 'current_year':
                      start = new Date(now.getFullYear(), 0, 1);
                      end = new Date(now.getFullYear(), 11, 31);
                      break;
                    case 'all_time':
                      start = null;
                      end = null;
                      break;
                    default:
                      start = null;
                      end = null;
                  }

                  if (start !== null && end !== null) {
                    setStartDate(formatDate(start));
                    setEndDate(formatDate(end));
                  } else {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
              >
                <option value="">Select Period</option>
                <option value="current_day">Current Day</option>
                <option value="previous_day">Previous Day</option>
                <option value="current_week">Current Week</option>
                <option value="previous_week">Previous Week</option>
                <option value="current_month">Current Month</option>
                <option value="previous_month">Previous Month</option>
                <option value="current_quarter">Current Quarter</option>
                <option value="previous_quarter">Previous Quarter</option>
                <option value="current_year">Current Year</option>
                <option value="all_time">All Time</option>
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

        <Row className="mb-4">
          <Col>
            <h4>Financial Analytics</h4>
            <p>Total Revenue: {revenue !== null ? `${revenue} USD` : 'Loading...'}</p>
          </Col>
          <Col>
            <h4>Client Analytics</h4>
            <p>Total Clients: {clients !== null ? clients : 'Loading...'}</p>
          </Col>
        </Row>

        <Row>
          <Col>
            <h4>Service Popularity</h4>
            {services.length === 0 ? (
              <p>No service data available.</p>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Number of Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.id}>
                      <td>{service.name}</td>
                      <td>{service.booking_count}</td>
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

export default Reports;
