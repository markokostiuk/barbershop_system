import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MyBusinesses from './pages/owner/MyBusinesses';
import OwnerCreationPage from './pages/admin/OwnerCreationPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import MyManagers from './pages/owner/MyManagers';
import Appointments from './pages/Appointments';
import MyServices from './pages/owner/MyServices';
import Workers from './pages/manager/Workers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/developer/ownercreate" element={<OwnerCreationPage />} />

        <Route path="/owner/mybusinesses" element={<MyBusinesses />} />
        <Route path="/owner/mymanagers" element={<MyManagers />} />
        <Route path="/owner/costpositions" element={<MyServices />} />
        <Route path="/manager/appointments" element={<Appointments />} />

        <Route path="/manager/appointments" element={<Appointments />} />
        <Route path="/manager/workers" element={<Workers />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
