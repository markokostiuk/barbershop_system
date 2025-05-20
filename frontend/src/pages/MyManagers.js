import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Modal, Form, Alert, Card } from 'react-bootstrap';
import AdminNavbar from '../components/Navbar';
import { getManagers, createManager, updateManager, deleteManager, assignManagerToBranch, getBranches, getBusinesses } from '../api/owner';

function MyManagers() {
  const [managers, setManagers] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [managerFormData, setManagerFormData] = useState({ email: '', password: '', name: '', branchId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadManagers();
    loadAllBranches();
  }, []);

  const loadManagers = async () => {
    setLoading(true);
    try {
      const data = await getManagers();
      setManagers(data);
    } catch (err) {
      setError('Failed to load managers');
    } finally {
      setLoading(false);
    }
  };

  const loadAllBranches = async () => {
    try {
      const businesses = await getBusinesses();
      const branchesPromises = businesses.map(async business => {
        const branches = await getBranches(business.id);
        return branches.map(branch => ({
          ...branch,
          businessName: business.name
        }));
      });
      const allBranchesData = await Promise.all(branchesPromises);
      setAllBranches(allBranchesData.flat());
    } catch (err) {
      setError('Failed to load branches');
    }
  };

  const handleManagerModalOpen = (manager = null) => {
    if (manager) {
      setManagerFormData({ email: manager.email, password: '', name: manager.name, branchId: manager.branchId || '' });
      setSelectedManager(manager.id);
      setIsEditingManager(true);
    } else {
      setManagerFormData({ email: '', password: '', name: '', branchId: '' });
      setSelectedManager(null);
      setIsEditingManager(false);
    }
    setShowManagerModal(true);
  };

  const handleManagerModalClose = () => {
    setShowManagerModal(false);
    setError('');
  };

  const handleDeleteModalOpen = (managerId) => {
    setSelectedManager(managerId);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setSelectedManager(null);
  };

  const handleManagerInputChange = (e) => {
    const { name, value } = e.target;
    setManagerFormData({ ...managerFormData, [name]: value });
  };

  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingManager) {
        await updateManager(selectedManager, managerFormData);
        if (managerFormData.branchId) {
          await assignManagerToBranch(selectedManager, managerFormData.branchId);
        }
      } else {
        const newManager = await createManager(managerFormData);
        if (managerFormData.branchId) {
          await assignManagerToBranch(newManager.id, managerFormData.branchId);
        }
      }
      loadManagers();
      handleManagerModalClose();
    } catch (err) {
      setError('Failed to save manager');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManager = async () => {
    setLoading(true);
    try {
      await deleteManager(selectedManager);
      loadManagers();
      handleDeleteModalClose();
    } catch (err) {
      setError('Failed to delete manager');
    } finally {
      setLoading(false);
    }
  };

  const getBranchInfo = (branchId) => {
    const branch = allBranches.find(b => b.id === branchId);
    return branch ? `${branch.businessName} - ${branch.locality} - ${branch.name}` : 'Not Assigned';
  };

  return (
    <div>
      <AdminNavbar role="owner" />
      <Container className="mt-5">
        <Row>
          <Col>
            <h2>My managers</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Button variant="primary" onClick={() => handleManagerModalOpen()} className="mb-4">
              Register new manager
            </Button>
            {loading ? (
              <div className="text-center">Загрузка...</div>
            ) : managers.length === 0 ? (
              <Alert variant="info">There are no managers yet.</Alert>
            ) : (
              <Row>
                {managers.map(manager => (
                  <Col md={6} key={manager.id} className="mb-3">
                    <Card className="shadow-sm">
                      <Card.Body className="d-flex justify-content-between align-items-start">
                        <div>
                          <Card.Title>{manager.name}</Card.Title>
                          <Card.Text>
                            <strong>Email:</strong> {manager.email}<br />
                            <strong>Branch:</strong> {getBranchInfo(manager.branchId)}
                          </Card.Text>
                        </div>
                        <div>
                          <Button variant="info" onClick={() => handleManagerModalOpen(manager)} className="me-2 mb-2">
                            Edit
                          </Button>
                          <Button variant="danger" onClick={() => handleDeleteModalOpen(manager.id)}>
                            Delete
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>

      {/* Manager Modal */}
      <Modal show={showManagerModal} onHide={handleManagerModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditingManager ? 'Edit manager data' : 'Register new meneger'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleManagerSubmit}>
            <Form.Group className="mb-3" controlId="managerEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={managerFormData.email}
                onChange={handleManagerInputChange}
                required
                disabled={isEditingManager}
              />
            </Form.Group>
            {!isEditingManager && (
              <Form.Group className="mb-3" controlId="managerPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={managerFormData.password}
                  onChange={handleManagerInputChange}
                  required
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3" controlId="managerName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={managerFormData.name}
                onChange={handleManagerInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="branchSelect">
              <Form.Label>Choose branch</Form.Label>
              <Form.Select
                name="branchId"
                value={managerFormData.branchId}
                onChange={handleManagerInputChange}
                required={!isEditingManager}
              >
                <option value="">-- Choose branch --</option>
                {allBranches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {`${branch.businessName} - ${branch.locality} - ${branch.name}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditingManager ? 'Reload' : 'Create'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Submit deleting</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this manager? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteModalClose}>
            Deny
          </Button>
          <Button variant="danger" onClick={handleDeleteManager} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MyManagers;
