import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Form, Alert, Table } from 'react-bootstrap';
import AdminNavbar from '../../components/Navbar';
import {
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkHours,
  createWorkHour,
  updateWorkHour,
  deleteWorkHour,
  addBatchWorkHours,
  getBranchPositions
} from '../../api/manager';

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

function getCurrentMonthDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workHours, setWorkHours] = useState({});
  const [error, setError] = useState('');
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingWorkHours, setLoadingWorkHours] = useState(false);

  // Filter state for work hours
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filteredWorkHours, setFilteredWorkHours] = useState([]);

  // Modals and form states
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerFormData, setWorkerFormData] = useState({ id: null, name: '', position_id: null, email: '', password: ''});
  const [positions, setPositions] = useState([]);
  const [isEditingWorker, setIsEditingWorker] = useState(false);

  const [showWorkHourModal, setShowWorkHourModal] = useState(false);
  const [workHourFormData, setWorkHourFormData] = useState({ id: null, date: '', start_work_hour: '', end_work_hour: '' });
  const [isEditingWorkHour, setIsEditingWorkHour] = useState(false);

  const [showBatchWorkHoursModal, setShowBatchWorkHoursModal] = useState(false);
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchDates, setBatchDates] = useState([]);
  const [batchWorkHours, setBatchWorkHours] = useState({}); // { date: { start_work_hour, end_work_hour } }

  useEffect(() => {
    // Set default filter to current month on load
    const [start, end] = getCurrentMonthDateRange();
    setFilterStartDate(start);
    setFilterEndDate(end);
  }, []);

  useEffect(() => {
    // Fetch workers on component mount
    const fetchWorkers = async () => {
      setLoadingWorkers(true);
      try {
        const data = await getWorkers();
        setWorkers(data);
        if (data.length > 0) {
          setSelectedWorker(data[0].id);
        }
      } catch (err) {
        setError('Failed to load workers');
      } finally {
        setLoadingWorkers(false);
      }
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    // Fetch work hours when selectedWorker changes
    const fetchWorkHours = async () => {
      if (!selectedWorker) {
        setWorkHours({});
        return;
      }
      setLoadingWorkHours(true);
      try {
        const data = await getWorkHours(selectedWorker);
        setWorkHours(prev => ({ ...prev, [selectedWorker]: data }));
      } catch (err) {
        setError('Failed to load work hours');
      } finally {
        setLoadingWorkHours(false);
      }
    };
    fetchWorkHours();
  }, [selectedWorker]);

  useEffect(() => {
    if (selectedWorker && filterStartDate && filterEndDate && workHours[selectedWorker]) {
      const filtered = workHours[selectedWorker].filter(wh => {
        return wh.date >= filterStartDate && wh.date <= filterEndDate;
      });
      setFilteredWorkHours(filtered);
    } else {
      setFilteredWorkHours([]);
    }
  }, [selectedWorker, filterStartDate, filterEndDate, workHours]);

  // Worker handlers
  const handleWorkerModalOpen = (worker = null) => {
    if (worker) {
      // Find position id from positions list by matching position id instead of name
      // const positionObj = positions.find(p => p.position.id === worker.position_id);
      setWorkerFormData({ id: worker.id, name: worker.name, position_id: worker.position.id ? worker.position.id : null , email: worker.email});
      console.log(workerFormData);
      setIsEditingWorker(true);
    } else {
      setWorkerFormData({ id: null, name: '', position_id: null , email: ''});
      setIsEditingWorker(false);
    }
    setShowWorkerModal(true);
  };

  const handleWorkerModalClose = () => {
    setShowWorkerModal(false);
    setError('');
  };

  const handleWorkerInputChange = (e) => {
    setWorkerFormData({ ...workerFormData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
      const fetchPositions = async () => {
        try {
          const data = await getBranchPositions();
          setPositions(data);
        } catch (err) {
          setError('Failed to load positions');
        }
      };
      fetchPositions();
  }, []);

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!workerFormData.name || !workerFormData.position_id || !workerFormData.email || (!isEditingWorker && !workerFormData.password)) {
      setError('Please, fill all fields');
      return;
    }
    try {
      // Prepare data with position_id instead of position name
      const submitData = {
        id: workerFormData.id,
        name: workerFormData.name,
        position_id: workerFormData.position_id,
        email: workerFormData.email,
        password: workerFormData.password
      };
      if (isEditingWorker) {
        await updateWorker(workerFormData.id, submitData);
        setWorkers(workers.map(w => (w.id === workerFormData.id ? { ...w, ...submitData } : w)));
      } else {
        const newWorker = await createWorker(submitData);
        setWorkers([...workers, newWorker]);
      }
      handleWorkerModalClose();
    } catch (err) {
      setError('Failed to save worker');
    }
  };

  const handleDeleteWorker = async (workerId) => {
    try {
      await deleteWorker(workerId);
      setWorkers(workers.filter(w => w.id !== workerId));
      if (selectedWorker === workerId) {
        setSelectedWorker(null);
      }
    } catch (err) {
      setError('Failed to delete worker');
    }
  };

  // Work hour handlers
  const handleWorkHourModalOpen = (workHour = null) => {
    if (workHour) {
      setWorkHourFormData({
        id: workHour.id,
        date: workHour.date,
        start_work_hour: workHour.start,
        end_work_hour: workHour.end
      });
      setIsEditingWorkHour(true);
    } else {
      setWorkHourFormData({ id: null, date: '', start_work_hour: '', end_work_hour: '' });
      setIsEditingWorkHour(false);
    }
    setShowWorkHourModal(true);
  };

  const handleWorkHourModalClose = () => {
    setShowWorkHourModal(false);
    setError('');
  };

  const handleWorkHourInputChange = (e) => {
    setWorkHourFormData({ ...workHourFormData, [e.target.name]: e.target.value });
  };

  const handleWorkHourSubmit = async (e) => {
    e.preventDefault();
    if (!workHourFormData.date || !workHourFormData.start_work_hour || !workHourFormData.end_work_hour) {
      setError('Date, start and end times are required');
      return;
    }
    try {
      if (isEditingWorkHour) {
        await updateWorkHour(workHourFormData.id, {
          start_work_hour: workHourFormData.start_work_hour,
          end_work_hour: workHourFormData.end_work_hour
        });
        setWorkHours({
          ...workHours,
          [selectedWorker]: workHours[selectedWorker].map(wh =>
            wh.id === workHourFormData.id
              ? { ...wh, start: workHourFormData.start_work_hour, end: workHourFormData.end_work_hour }
              : wh
          )
        });
      } else {
        const newWh = await createWorkHour(selectedWorker, {
          date: workHourFormData.date,
          start_work_hour: workHourFormData.start_work_hour,
          end_work_hour: workHourFormData.end_work_hour
        });
        setWorkHours({
          ...workHours,
          [selectedWorker]: [...(workHours[selectedWorker] || []), { id: newWh.id, date: newWh.date, start: newWh.start, end: newWh.end }]
        });
      }
      handleWorkHourModalClose();
    } catch (err) {
      setError('Failed to save work hour');
    }
  };

  const handleDeleteWorkHour = async (workHourId) => {
    try {
      await deleteWorkHour(workHourId);
      setWorkHours({
        ...workHours,
        [selectedWorker]: workHours[selectedWorker].filter(wh => wh.id !== workHourId)
      });
    } catch (err) {
      setError('Failed to delete work hour');
    }
  };

  // Batch work hours handlers
  const handleBatchStartDateChange = (e) => {
    const startDate = e.target.value;
    setBatchStartDate(startDate);
    if (batchEndDate && startDate <= batchEndDate) {
      const dates = getDatesInRange(startDate, batchEndDate);
      setBatchDates(dates);
      // Initialize batchWorkHours for new dates
      const newBatchWorkHours = {};
      dates.forEach(date => {
        newBatchWorkHours[date] = batchWorkHours[date] || { start_work_hour: '', end_work_hour: '' };
      });
      setBatchWorkHours(newBatchWorkHours);
    } else {
      setBatchDates([]);
      setBatchWorkHours({});
    }
  };

  const handleBatchEndDateChange = (e) => {
    const endDate = e.target.value;
    setBatchEndDate(endDate);
    if (batchStartDate && batchStartDate <= endDate) {
      const dates = getDatesInRange(batchStartDate, endDate);
      setBatchDates(dates);
      // Initialize batchWorkHours for new dates
      const newBatchWorkHours = {};
      dates.forEach(date => {
        newBatchWorkHours[date] = batchWorkHours[date] || { start_work_hour: '', end_work_hour: '' };
      });
      setBatchWorkHours(newBatchWorkHours);
    } else {
      setBatchDates([]);
      setBatchWorkHours({});
    }
  };

  const handleBatchWorkHourChange = (date, field, value) => {
    setBatchWorkHours({
      ...batchWorkHours,
      [date]: {
        ...batchWorkHours[date],
        [field]: value
      }
    });
  };

  const handleBatchWorkHoursSubmit = async () => {
    // Validate all entries
    for (const date of batchDates) {
      const wh = batchWorkHours[date];
      if (!wh.start_work_hour || !wh.end_work_hour) {
        setError('All dates must have start and end times');
        return;
      }
    }
    try {
      for (const date of batchDates) {
        const wh = batchWorkHours[date];
        await createWorkHour(selectedWorker, {
          date,
          start_work_hour: wh.start_work_hour,
          end_work_hour: wh.end_work_hour
        });
      }
      // Refresh work hours
      const data = await getWorkHours(selectedWorker);
      setWorkHours(prev => ({ ...prev, [selectedWorker]: data }));
      setShowBatchWorkHoursModal(false);
      setBatchStartDate('');
      setBatchEndDate('');
      setBatchDates([]);
      setBatchWorkHours({});
      setError('');
    } catch (err) {
      setError('Failed to save batch work hours');
    }
  };

  return (
    <div>
      <AdminNavbar role="manager" />
      <Container className="mt-5">
        <h2>Workers Management</h2>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          <Col md={4}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4>Workers</h4>
              <Button variant="primary" onClick={() => handleWorkerModalOpen()}>Add Worker</Button>
            </div>
            {loadingWorkers ? (
              <p>Loading workers...</p>
            ) : workers.length === 0 ? (
                <Alert variant="btn btn-outline-primary">There are no workers yet.</Alert>
              ) : (
              <div>
                {workers.map(worker => (
                  <div
                    key={worker.id}
                    className={`d-flex justify-content-between align-items-center mb-1 ${selectedWorker === worker.id ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedWorker(worker.id)}
                  >
                    <span>{worker.name} ({worker.position.name})</span>
                    <div>
                      <Button size="sm" variant="btn btn-outline-primary" className="me-2" onClick={e => { e.stopPropagation(); handleWorkerModalOpen(worker); }}>Edit</Button>
                      <Button size="sm" variant="btn btn-outline-danger" onClick={e => { e.stopPropagation(); handleDeleteWorker(worker.id); }}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Col>

          <Col md={8}>
            <h4>Work Hours {selectedWorker ? `for ${workers.find(w => w.id === selectedWorker)?.name}` : ''}</h4>
            {selectedWorker ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Button variant="primary" onClick={() => handleWorkHourModalOpen()}>Add Work Hour</Button>
                  <Button variant="secondary" onClick={() => setShowBatchWorkHoursModal(true)}>Add Batch Work Hours</Button>
                </div>
                <Form className="mb-3">
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="filterStartDate">
                        <Form.Label>Filter Start Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={filterStartDate}
                          onChange={e => setFilterStartDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="filterEndDate">
                        <Form.Label>Filter End Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={filterEndDate}
                          onChange={e => setFilterEndDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
                {loadingWorkHours ? (
                  <p>Loading work hours...</p>
                ) : (
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkHours.length > 0 ? (
                        filteredWorkHours.map(wh => (
                          <tr key={wh.id}>
                            <td>{wh.date}</td>
                            <td>{wh.start}</td>
                            <td>{wh.end}</td>
                            <td>
                              <Button size="sm" variant="btn btn-outline-primary" onClick={() => handleWorkHourModalOpen(wh)}>Edit</Button>{' '}
                              <Button size="sm" variant="btn btn-outline-danger" onClick={() => handleDeleteWorkHour(wh.id)}>Delete</Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No work hours set for selected period.</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </>
            ) : (
              <p>Select a worker to view and manage work hours.</p>
            )}
          </Col>
        </Row>

        {/* Worker Modal */}
        <Modal show={showWorkerModal} onHide={handleWorkerModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditingWorker ? 'Edit Worker' : 'Add Worker'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleWorkerSubmit}>
              <Form.Group className="mb-3" controlId="workerName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={workerFormData.name}
                  onChange={handleWorkerInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="workerEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="text"
                  name="email"
                  value={workerFormData.email}
                  onChange={handleWorkerInputChange}
                  required
                  disabled={isEditingWorker}
                />
              </Form.Group>
              {!isEditingWorker && (
                <Form.Group className="mb-3" controlId="workerPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={workerFormData.password}
                    onChange={handleWorkerInputChange}
                    required
                  />
                </Form.Group>
              )}
              <Form.Group className="mb-3" controlId="workerPosition">
                <Form.Label>Select Position</Form.Label>
                <Form.Select
                  name="position_id"
                  value={workerFormData.position_id || ''}
                  onChange={handleWorkerInputChange}
                  required
                >
                  <option value="" disabled>Select Position</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Button variant="primary" type="submit">
                {isEditingWorker ? 'Update' : 'Create'}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Work Hour Modal */}
        <Modal show={showWorkHourModal} onHide={handleWorkHourModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditingWorkHour ? 'Edit Work Hour' : 'Add Work Hour'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleWorkHourSubmit}>
              <Form.Group className="mb-3" controlId="workHourDate">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={workHourFormData.date}
                  onChange={handleWorkHourInputChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="workHourStart">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="time"
                  name="start_work_hour"
                  value={workHourFormData.start_work_hour}
                  onChange={handleWorkHourInputChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="workHourEnd">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="time"
                  name="end_work_hour"
                  value={workHourFormData.end_work_hour}
                  onChange={handleWorkHourInputChange}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                {isEditingWorkHour ? 'Update' : 'Create'}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Batch Work Hours Modal */}
        <Modal show={showBatchWorkHoursModal} onHide={() => setShowBatchWorkHoursModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Batch Work Hours</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="batchStartDate">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={batchStartDate}
                onChange={handleBatchStartDateChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="batchEndDate">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={batchEndDate}
                onChange={handleBatchEndDateChange}
              />
            </Form.Group>
            {batchDates.length > 0 && (
              <>
                <h5>Set Work Hours for Dates</h5>
                {batchDates.map(date => (
                  <Row key={date} className="mb-3">
                    <Col md={4}>
                      <Form.Label>{date}</Form.Label>
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="time"
                        value={batchWorkHours[date]?.start_work_hour || ''}
                        onChange={e => handleBatchWorkHourChange(date, 'start_work_hour', e.target.value)}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="time"
                        value={batchWorkHours[date]?.end_work_hour || ''}
                        onChange={e => handleBatchWorkHourChange(date, 'end_work_hour', e.target.value)}
                      />
                    </Col>
                  </Row>
                ))}
              </>
            )}
            <Button variant="primary" onClick={handleBatchWorkHoursSubmit}>Save Batch Work Hours</Button>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default Workers;
