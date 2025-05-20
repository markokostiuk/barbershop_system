import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Modal, Form, Alert, Table } from 'react-bootstrap';
import AdminNavbar from '../components/Navbar';
import { getBusinesses, getBranches, getPositions, createPosition, updatePosition, deletePosition, getServices, createService, updateService, deleteService, getServiceCosts, createServiceCost, updateServiceCost, deleteServiceCost } from '../api/owner';

function MyServices() {
  const [businesses, setBusinesses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [positions, setPositions] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceCosts, setServiceCosts] = useState([]);

  const [error, setError] = useState('');

  // Modals and form states
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [positionFormData, setPositionFormData] = useState({ id: null, name: '' });
  const [isEditingPosition, setIsEditingPosition] = useState(false);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({ id: null, name: '', duration: '' });
  const [isEditingService, setIsEditingService] = useState(false);

  const [showServiceCostModal, setShowServiceCostModal] = useState(false);
  const [serviceCostFormData, setServiceCostFormData] = useState({ id: null, position_id: '', service_id: '', price: '' });
  const [isEditingServiceCost, setIsEditingServiceCost] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadBranches(selectedBusiness);
      setSelectedBranch(null);
      setPositions([]);
      setServices([]);
      setServiceCosts([]);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    if (selectedBranch) {
      loadPositions(selectedBranch);
      loadServices(selectedBranch);
      loadServiceCosts(selectedBranch)
    }
  }, [selectedBranch]);

  const loadBusinesses = async () => {
    try {
      const data = await getBusinesses();
      setBusinesses(data);
    } catch (err) {
      setError('Failed to load businesses');
    }
  };

  const loadBranches = async (businessId) => {
    try {
      const data = await getBranches(businessId);
      setBranches(data);
    } catch (err) {
      setError('Failed to load branches');
    }
  };

  const loadPositions = async (branchId) => {
    try {
      const data = await getPositions(branchId);
      setPositions(data);
    } catch (err) {
      setError('Failed to load positions');
    }
  };

  const loadServices = async (branchId) => {
    try {
      const data = await getServices(branchId);
      setServices(data);
    } catch (err) {
      setError('Failed to load services');
    }
  };

  const loadServiceCosts = async (branchId) => {
    try {
      const data = await getServiceCosts(branchId);
      setServiceCosts(data);
    } catch (err) {
      setError('Failed to load service costs');
    }
  };

  // Position handlers
  const handlePositionModalOpen = (position = null) => {
    if (position) {
      setPositionFormData({ id: position.id, name: position.name });
      setIsEditingPosition(true);
    } else {
      setPositionFormData({ id: null, name: '' });
      setIsEditingPosition(false);
    }
    setShowPositionModal(true);
  };

  const handlePositionModalClose = () => {
    setShowPositionModal(false);
    setError('');
  };

  const handlePositionInputChange = (e) => {
    setPositionFormData({ ...positionFormData, [e.target.name]: e.target.value });
  };

  const handlePositionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) {
      setError('Select a branch first');
      return;
    }
    try {
      if (isEditingPosition) {
        await updatePosition(positionFormData.id, { name: positionFormData.name });
      } else {
        await createPosition(selectedBranch, { name: positionFormData.name });
      }
      loadPositions(selectedBranch);
      loadServiceCosts(selectedBranch);
      handlePositionModalClose();
    } catch (err) {
      setError('Failed to save position');
    }
  };

  const handleDeletePosition = async (positionId) => {
    try {
      await deletePosition(positionId);
      loadPositions(selectedBranch);
    } catch (err) {
      setError('Failed to delete position');
    }
  };

  // Service handlers
  const handleServiceModalOpen = (service = null) => {
    if (service) {
      setServiceFormData({ id: service.id, name: service.name, duration: service.duration });
      setIsEditingService(true);
    } else {
      setServiceFormData({ id: null, name: '', duration: '' });
      setIsEditingService(false);
    }
    setShowServiceModal(true);
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
    setError('');
  };

  const handleServiceInputChange = (e) => {
    setServiceFormData({ ...serviceFormData, [e.target.name]: e.target.value });
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) {
      setError('Select a branch first');
      return;
    }
    try {
      const durationInt = parseInt(serviceFormData.duration, 10);
      if (isNaN(durationInt) || durationInt <= 0) {
        setError('Duration must be a positive integer');
        return;
      }
      if (isEditingService) {
        await updateService(serviceFormData.id, { name: serviceFormData.name, duration: durationInt });
      } else {
        await createService(selectedBranch, { name: serviceFormData.name, duration: durationInt });
      }
      loadServices(selectedBranch);
      loadServiceCosts(selectedBranch);
      handleServiceModalClose();
    } catch (err) {
      setError('Failed to save service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await deleteService(serviceId);
      loadServices(selectedBranch);
    } catch (err) {
      setError('Failed to delete service');
    }
  };

  // ServiceCost handlers
  const handleServiceCostModalOpen = (serviceCost = null) => {
    if (serviceCost) {
      setServiceCostFormData({ id: serviceCost.id, position_id: serviceCost.position_id , service_id: serviceCost.service_id, price: serviceCost.price});
      setIsEditingServiceCost(true);
    } else {
      setServiceCostFormData({ id: null, service_id: '', price: '', position_id: null });
      setIsEditingServiceCost(false);
    }
    setShowServiceCostModal(true);
  };

  const handleServiceCostModalClose = () => {
    setShowServiceCostModal(false);
    setError('');
  };

  const handleServiceCostInputChange = (e) => {
    setServiceCostFormData({ ...serviceCostFormData, [e.target.name]: e.target.value });
  };

  const handleServiceCostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) {
      setError('Select a branch first');
      return;
    }
    if (!serviceCostFormData.service_id) {
      setError('Select a service');
      return;
    }
    if (!serviceCostFormData.position_id) {
      setError('Select a position');
      return;
    }
    try {
      const priceInt = parseInt(serviceCostFormData.price, 10);
      if (isNaN(priceInt) || priceInt < 0) {
        setError('Price must be a non-negative integer');
        return;
      }
      if (isEditingServiceCost) {
        await updateServiceCost(serviceCostFormData.id, { price: priceInt, service_id: serviceCostFormData.service_id, position_id: serviceCostFormData.position_id });
      } else {
        await createServiceCost(serviceCostFormData.position_id, { service_id: serviceCostFormData.service_id, price: priceInt });
      }
      loadServiceCosts(selectedBranch);
      handleServiceCostModalClose();
    } catch (err) {
      setError('Failed to save service cost');
    }
  };

  const handleDeleteServiceCost = async (serviceCostId) => {
    try {
      await deleteServiceCost(serviceCostId);
      loadServiceCosts(selectedBranch);
    } catch (err) {
      setError('Failed to delete service cost');
    }
  };

  // When a position is selected, load its service costs
  const handlePositionSelect = (positionId) => {
    loadServiceCosts(positionId);
  };

  return (
    <div>
      <AdminNavbar role="owner" />
      <Container className="mt-5">
        <h2>Service Administration</h2>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>Business</Form.Label>
          <Form.Select value={selectedBusiness || ''} onChange={e => setSelectedBusiness(e.target.value || null)}>
            <option value="">Select Business</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Form.Select>
        </Form.Group>

        {selectedBusiness && (
          <Form.Group className="mb-3">
            <Form.Label>Branch</Form.Label>
            <Form.Select value={selectedBranch || ''} onChange={e => setSelectedBranch(e.target.value || null)}>
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        {selectedBranch && (
          <>
            <Row>
              <Col md={4}>
                <h4>Positions</h4>
                <Button variant="primary" onClick={() => handlePositionModalOpen()}>Add Position</Button>
                <Table striped bordered hover size="sm" className="mt-2">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(position => (
                      <tr key={position.id} onClick={() => handlePositionSelect(position.id)} style={{ cursor: 'pointer' }}>
                        <td>{position.name}</td>
                        <td>
                          <Button size="sm" variant="info" onClick={e => { e.stopPropagation(); handlePositionModalOpen(position); }}>Edit</Button>{' '}
                          <Button size="sm" variant="danger" onClick={e => { e.stopPropagation(); handleDeletePosition(position.id); }}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>

              <Col md={4}>
                <h4>Services</h4>
                <Button variant="primary" onClick={() => handleServiceModalOpen()}>Add Service</Button>
                <Table striped bordered hover size="sm" className="mt-2">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Duration (min)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => (
                      <tr key={service.id}>
                        <td>{service.name}</td>
                        <td>{service.duration}</td>
                        <td>
                          <Button size="sm" variant="info" onClick={() => handleServiceModalOpen(service)}>Edit</Button>{' '}
                          <Button size="sm" variant="danger" onClick={() => handleDeleteService(service.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>

              <Col md={4}>
                <h4>Service Costs</h4>
                <Button variant="primary" onClick={() => {
                  if (positions.length === 0) {
                    setError('Add a position first');
                    return;
                  }
                  handleServiceCostModalOpen();
                }}>Add Service Cost</Button>
                <Table striped bordered hover size="sm" className="mt-2">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Service</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceCosts.map(position => (
                      position.service_costs.map(sc => {
                        const service = services.find(s => s.id === sc.service_id);
                        return (
                          <tr key={sc.id}>
                            <td>{position.position_name}</td>
                            <td>{service ? service.name : 'Неизвестно'}</td>
                            <td>{sc.price}</td>
                            <td>
                              <Button size="sm" variant="info" onClick={() => handleServiceCostModalOpen(sc)}>Edit</Button>{' '}
                              <Button size="sm" variant="danger" onClick={() => handleDeleteServiceCost(sc.id, position.position_id)}>Delete</Button>
                            </td>
                          </tr>
                        );
                      })
                    ))}
                  </tbody>

                </Table>
              </Col>
            </Row>
          </>
        )}

        {/* Position Modal */}
        <Modal show={showPositionModal} onHide={handlePositionModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditingPosition ? 'Edit Position' : 'Add Position'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handlePositionSubmit}>
              <Form.Group className="mb-3" controlId="positionName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={positionFormData.name}
                  onChange={handlePositionInputChange}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                {isEditingPosition ? 'Update' : 'Create'}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Service Modal */}
        <Modal show={showServiceModal} onHide={handleServiceModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditingService ? 'Edit Service' : 'Add Service'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleServiceSubmit}>
              <Form.Group className="mb-3" controlId="serviceName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={serviceFormData.name}
                  onChange={handleServiceInputChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="serviceDuration">
                <Form.Label>Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  name="duration"
                  value={serviceFormData.duration}
                  onChange={handleServiceInputChange}
                  required
                  min={1}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                {isEditingService ? 'Update' : 'Create'}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Service Cost Modal */}
        <Modal show={showServiceCostModal} onHide={handleServiceCostModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditingServiceCost ? 'Edit Service Cost' : 'Add Service Cost'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleServiceCostSubmit}>
              <Form.Group className="mb-3" controlId="serviceCostPosition">
                <Form.Label>Position</Form.Label>
                <Form.Select
                  name="position_id"
                  value={serviceCostFormData.position_id || ''}
                  onChange={handleServiceCostInputChange}
                  required
                >
                  <option value="">Select Position</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3" controlId="serviceCostService">
                <Form.Label>Service</Form.Label>
                <Form.Select
                  name="service_id"
                  value={serviceCostFormData.service_id}
                  onChange={handleServiceCostInputChange}
                  required
                >
                  <option value="">Select Service</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3" controlId="serviceCostPrice">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={serviceCostFormData.price}
                  onChange={handleServiceCostInputChange}
                  required
                  min={0}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                {isEditingServiceCost ? 'Update' : 'Create'}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default MyServices;
