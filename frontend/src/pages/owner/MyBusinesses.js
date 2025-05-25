import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Table, Modal, Form, Alert, Accordion } from 'react-bootstrap';
import AdminNavbar from '../../components/Navbar';
import { getBusinesses, createBusiness, updateBusiness, deleteBusiness, getBranches, updateBranch, deleteBranch } from '../../api/owner';
import axios from 'axios'; // Import axios for direct API calls


function MyBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [branchesMap, setBranchesMap] = useState();
  const [expandedBusiness, setExpandedBusiness] = useState(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [businessFormData, setBusinessFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
    id: null,
    name: '',
    locality: '',
    address: '',
    phone_number: '',
    start_work_hour: '09:00',
    end_work_hour: '18:00'
  });

  const [error, setError] = useState('');
  const [showDeleteBusinessModal, setShowDeleteBusinessModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const data = await getBusinesses();
      setBusinesses(data);
    } catch (err) {
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async (businessId) => {
    if (!businessId) return; // Prevent loading branches if businessId is null or undefined
    try {
      const data = await getBranches(businessId);
      setBranchesMap(prev => ({ ...prev, [businessId]: data }));
      setExpandedBusiness(businessId);
    } catch (err) {
      setError('Failed to load branches for business ' + businessId);
    }
  };

  const createBranch = async (businessId, branchData) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(`${BASE_URL}/owner/businesses/${businessId}/branches`, branchData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  };



  const handleBusinessModalOpen = (business = null) => {
    if (business) {
      setBusinessFormData({ name: business.name });
      setIsEditingBusiness(true);
      setExpandedBusiness(business.id);
    } else {
      setBusinessFormData({ name: '' });
      setIsEditingBusiness(false);
    }
    setShowBusinessModal(true);
  };

  const handleBusinessModalClose = () => {
    setShowBusinessModal(false);
    setError('');
  };

  const handleBranchModalOpen = (branch = null, businessId = null) => {
    if (branch) {
      setBranchFormData({
        id: branch.id,
        name: branch.name,
        locality: branch.locality,
        address: branch.address,
        phone_number: branch.phone_number,
        start_work_hour: branch.start_work_hour,
        end_work_hour: branch.end_work_hour
      });
      setIsEditingBranch(true);
    } else {
      setBranchFormData({
        id: null,
        name: '',
        locality: '',
        address: '',
        phone_number: '',
        start_work_hour: '',
        end_work_hour: ''
      });
      setIsEditingBranch(false);
    }


    if (businessId) {
      setExpandedBusiness(businessId);
    }
    setShowBranchModal(true);
  };

  const handleBranchModalClose = () => {
    setShowBranchModal(false);
    setError('');
  };

  const handleBusinessInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessFormData({ ...businessFormData, [name]: value });
  };

  const handleBranchInputChange = (e) => {
    const { name, value } = e.target;
    setBranchFormData({ ...branchFormData, [name]: value });
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingBusiness) {
        await updateBusiness(expandedBusiness, businessFormData);
      } else {
        await createBusiness(businessFormData);
      }
      loadBusinesses();
      handleBusinessModalClose();
    } catch (err) {
      setError('Failed to save business');
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingBranch) {
        await updateBranch(branchFormData.id, branchFormData);
      } else if (expandedBusiness) {

        await createBranch(expandedBusiness, branchFormData);
      } else {
        setError('No business selected for branch creation');
        return;
      }
      loadBranches(expandedBusiness);
      handleBranchModalClose();
    } catch (err) {
      setError('Failed to save branch: ' + err.message);
    }
  };


  const handleDeleteBusiness = async (businessId) => {
    try {
      await deleteBusiness(businessId);
      loadBusinesses();
    } catch (err) {
      setError('Failed to delete business');
    }
  };

  const handleDeleteBranch = async (branchId, businessId) => {
    try {
      await deleteBranch(branchId);
      loadBranches(businessId);
    } catch (err) {
      setError('Failed to delete branch');
    }
  };

  const handleToggleBusiness = (businessId) => {
    if (expandedBusiness === businessId) {
      setExpandedBusiness(null);
    } else {
      setExpandedBusiness(businessId);
      if (businessId && !branchesMap[businessId]) {
        loadBranches(businessId);
      }
    }
  };

  const handleCopy = async (business_id) => {
    try {
      await navigator.clipboard.writeText(`http://localhost:3000/cities/${business_id}/`);
      alert("Copied!");
    } catch (err) {
      console.error("Error: ", err);
    }
  };

  return (
    <div>
      <AdminNavbar role="owner" />
      <Container className="mt-5">
        <Row>
          <Col>
            <h2>My Businesses</h2>
            {error && <Alert variant="btn btn-outline-danger">{error}</Alert>}
            <Button variant="primary" onClick={() => handleBusinessModalOpen()} className="mb-3">
              Add Business
            </Button>
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : businesses.length === 0 ? (
              <Alert variant="btn btn-outline-primary">There are no your businesses yet.</Alert>
            ) : (
            <Accordion activeKey={expandedBusiness} onSelect={handleToggleBusiness}>
              {businesses.map(business => (
                <Accordion.Item key={business.id} eventKey={business.id}>
                  <Accordion.Header className="d-flex justify-content-between align-items-center">
                    <b>{business.name}</b>
                    <div className="ms-auto d-flex align-items-center ms-auto">
                      <Button variant="btn btn-outline-primary" size="sm" className="ms-2" onClick={(e) => { e.stopPropagation(); handleBusinessModalOpen(business); }}>
                        Edit
                      </Button>
                      <Button variant="btn btn-outline-danger" size="sm" className="ms-2" onClick={(e) => { e.stopPropagation(); setBusinessToDelete(business); setShowDeleteBusinessModal(true); }}>
                        Delete
                      </Button>
                      <Button variant="primary" size="sm" className="ms-2" onClick={(e) => { e.stopPropagation(); handleBranchModalOpen(null, business.id); }}>
                        Add Branch
                      </Button>
                      <Button variant="outline-secondary" size="sm" className="ms-2" onClick={() => handleCopy(business.id)}>
                        Copy client link
                      </Button>
                    </div>
                  </Accordion.Header>

                  <Accordion.Body>
                    {branchesMap[business.id] ? (
                      branchesMap[business.id].length > 0 ? (
                        branchesMap[business.id].map(branch => (
                          <div key={branch.id} className="d-flex justify-content-between align-items-center mb-3 border p-3 rounded">
                            <div>
                              <div><strong>{branch.name}</strong></div>
                              <div>Location: {branch.locality}, {branch.address}</div>
                              <div>Work hours: {branch.start_work_hour} - {branch.end_work_hour}</div>
                            </div>
                            <div>
                              <Button variant="btn btn-outline-primary" onClick={() => handleBranchModalOpen(branch, null)} className="me-2">
                                Edit
                              </Button>
                              <Button variant="btn btn-outline-danger" onClick={() => { setBranchToDelete(branch); setShowDeleteBranchModal(true); }}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No branches available for this business.</p>
                      )
                    ) : (
                      <p>Loading branches...</p>
                    )}
                  </Accordion.Body>

                </Accordion.Item>
              ))}
            </Accordion>
            )}
          </Col>
        </Row>


      </Container>


      <Modal show={showBusinessModal} onHide={handleBusinessModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditingBusiness ? 'Edit Business' : 'Add Business'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="btn btn-outline-danger">{error}</Alert>}
          <Form onSubmit={handleBusinessSubmit}>
            <Form.Group className="mb-3" controlId="businessName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={businessFormData.name}
                onChange={handleBusinessInputChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              {isEditingBusiness ? 'Update' : 'Create'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>


      <Modal show={showDeleteBusinessModal} onHide={() => setShowDeleteBusinessModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete Business</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the business "{businessToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteBusinessModal(false)}>
            Cancel
          </Button>
          <Button variant="btn btn-outline-danger" onClick={() => { handleDeleteBusiness(businessToDelete.id); setShowDeleteBusinessModal(false); }}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal show={showBranchModal} onHide={handleBranchModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditingBranch ? 'Edit Branch' : 'Add Branch'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="btn btn-outline-danger">{error}</Alert>}
          <Form onSubmit={handleBranchSubmit}>
            <Form.Group className="mb-3" controlId="branchName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={branchFormData.name}
                onChange={handleBranchInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="branchLocality">
              <Form.Label>Locality</Form.Label>
              <Form.Control
                type="text"
                name="locality"
                value={branchFormData.locality}
                onChange={handleBranchInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="branchAddress">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={branchFormData.address}
                onChange={handleBranchInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="branchPhone">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phone_number"
                value={branchFormData.phone_number}
                onChange={handleBranchInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="startWorkHour">
              <Form.Label>Start Work Hour</Form.Label>
              <Form.Control
                type="time"
                name="start_work_hour"
                value={branchFormData.start_work_hour}
                onChange={handleBranchInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="endWorkHour">
              <Form.Label>End Work Hour</Form.Label>
              <Form.Control
                type="time"
                name="end_work_hour"
                value={branchFormData.end_work_hour}
                onChange={handleBranchInputChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              {isEditingBranch ? 'Update' : 'Create'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>


      <Modal show={showDeleteBranchModal} onHide={() => setShowDeleteBranchModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete Branch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the branch "{branchToDelete?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteBranchModal(false)}>
            Cancel
          </Button>
          <Button variant="btn btn-outline-danger" onClick={() => { handleDeleteBranch(branchToDelete.id, branchToDelete.business_id); setShowDeleteBranchModal(false); }}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MyBusinesses;
