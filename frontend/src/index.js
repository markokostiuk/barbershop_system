import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MyBusinesses from './pages/MyBusinesses';
import OwnerCreationPage from './pages/OwnerCreationPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import MyManagers from './pages/MyManagers';
import Appointments from './pages/manager/Appointments';
import MyServices from './pages/MyServices';

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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
