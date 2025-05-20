import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getBranches } from '../api/manager'; // Import from manager API module

function AdminNavbar({ role }) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      if (role === 'manager') {
        try {
          const managerBranches = await getBranches();
          setBranches(managerBranches);
          // Set the first branch as selected by default or retrieve from localStorage
          const savedBranchId = localStorage.getItem('selectedBranchId');
          if (savedBranchId && managerBranches.some(b => b.id === parseInt(savedBranchId))) {
            setSelectedBranch(managerBranches.find(b => b.id === parseInt(savedBranchId)));
          } else if (managerBranches.length > 0) {
            setSelectedBranch(managerBranches[0]);
            localStorage.setItem('selectedBranchId', managerBranches[0].id);
          }
        } catch (err) {
          console.error('Failed to load branches:', err);
        }
      }
    };

    fetchBranches();
  }, [role]);




  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('selectedBranchId');
    navigate('/login');
  };

  const handleBranchSelect = (branchId) => {
    const selected = branches.find(b => b.id === parseInt(branchId));
    setSelectedBranch(selected);
    localStorage.setItem('selectedBranchId', branchId);
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
                <Nav.Link onClick={() => navigate('/admin/mybusinesses')}>My Businesses</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/mymanagers')}>My Managers</Nav.Link>
                <Nav.Link onClick={() => navigate('/manager/statistics')}>Statistics</Nav.Link>
              </>
            )}

            {role === 'manager' && (
              <>
              <Navbar.Brand>Manager Panel</Navbar.Brand>
                <Nav.Link onClick={() => navigate('/manager/appointments')}>Appointments</Nav.Link>
                
                {branches.length > 0 && (
                  <NavDropdown title={selectedBranch ? `${selectedBranch.businessName} - ${selectedBranch.name}` : 'Select Branch'} id="branch-dropdown">
                    {branches.map(branch => (
                      <NavDropdown.Item key={branch.id} onClick={() => handleBranchSelect(branch.id)}>
                        {branch.businessName} - {branch.name} - {branch.locality} - {branch.address}
                      </NavDropdown.Item>
                    ))}
                  </NavDropdown>
                )}
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
