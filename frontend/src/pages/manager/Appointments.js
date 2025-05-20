import React from 'react';
import { Container } from 'react-bootstrap';
import AdminNavbar from '../../components/Navbar';

function Appointments() {
  const role = localStorage.getItem('role');

  return (
    <>
      <AdminNavbar role={role} />
      <Container className="mt-4">
        <h2>Appointments</h2>
        <p>This is a placeholder page for managing appointments. Functionality will be implemented soon.</p>
      </Container>
    </>
  );
}

export default Appointments;
