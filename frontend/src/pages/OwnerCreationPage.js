import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { registerOwner } from '../api/developer';

function OwnerCreationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('access_token');
      const data = await registerOwner({ email, password, role: 'owner' }, token);
      setSuccess('Owner created successfully. You can now logout and login as owner.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create owner');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ maxWidth: 400, width: '100%' }} className="p-4 shadow">
        <Card.Title className="text-center mb-4">Create Owner Account</Card.Title>
        <Form onSubmit={handleCreateOwner}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Button variant="primary" type="submit" className="w-100">
            Create Owner
          </Button>
        </Form>
        <Button variant="secondary" onClick={handleLogout} className="w-100 mt-3">
          Logout
        </Button>
      </Card>
    </Container>
  );
}

export default OwnerCreationPage;
