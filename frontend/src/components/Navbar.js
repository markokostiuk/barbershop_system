import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function AdminNavbar({ role }) {
  const navigate = useNavigate();


  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="lg" className="mb-4">
      <Container>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {role === 'owner' && (
              <>
                <Navbar.Brand>Admin Panel</Navbar.Brand>
                <Nav.Link onClick={() => navigate('/owner/mybusinesses')}>My Businesses</Nav.Link>
                <Nav.Link onClick={() => navigate('/owner/mymanagers')}>My Managers</Nav.Link>
                <Nav.Link onClick={() => navigate('/owner/costpositions')}>Prices&Positions</Nav.Link>
                <Nav.Link onClick={() => navigate('/owner/reports')}>Reports</Nav.Link>
              </>
            )}

            {role === 'manager' && (
              <>
              <Navbar.Brand>Manager Panel</Navbar.Brand>
                <Nav.Link onClick={() => navigate('/manager/appointments')}>Appointments</Nav.Link>
                <Nav.Link onClick={() => navigate('/manager/workers')}>Workers&Schedule</Nav.Link>
              </>
            )}

            {role === 'worker' && (
              <>
              <Navbar.Brand>Worker Panel</Navbar.Brand>
                <Nav.Link onClick={() => navigate('/worker/myappointments')}>Appointments</Nav.Link>
                <Nav.Link onClick={() => navigate('/worker/myschedule')}>Workers&Schedule</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AdminNavbar;
