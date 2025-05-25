import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import LoginPage from './pages/LoginPage';
import MyBusinesses from './pages/owner/MyBusinesses';
import OwnerCreationPage from './pages/admin/OwnerCreationPage';
import MyManagers from './pages/owner/MyManagers';
import Appointments from './pages/manager/Appointments';
import MyServices from './pages/owner/MyServices';
import Workers from './pages/manager/Workers';
import ProtectedRoute from './components/ProtectedRoute';
import MyAppointments from './pages/worker/MyAppointments';
import Cities from './pages/client/Cities';
import AppointmentConfirmation from './pages/client/AppointmentConfirmation';
import Reports from './pages/owner/Reports';
import MySchedule from './pages/worker/MySchedule';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="cities/:id" element={<Cities />} />
        <Route path="appointment-confirmation/:appointmentId" element={<AppointmentConfirmation />} />

        <Route
          path="/developer/ownercreate"
          element={<ProtectedRoute><OwnerCreationPage /></ProtectedRoute>}
        />
        <Route
          path="/owner/mybusinesses"
          element={<ProtectedRoute><MyBusinesses /></ProtectedRoute>}
        />
        <Route
          path="/owner/mymanagers"
          element={<ProtectedRoute><MyManagers /></ProtectedRoute>}
        />
        <Route
          path="/owner/costpositions"
          element={<ProtectedRoute><MyServices /></ProtectedRoute>}
        />
        <Route
          path="/owner/reports"
          element={<ProtectedRoute><Reports /></ProtectedRoute>}
        />
        <Route
          path="/manager/appointments"
          element={<ProtectedRoute><Appointments /></ProtectedRoute>}
        />
        <Route
          path="/manager/workers"
          element={<ProtectedRoute><Workers /></ProtectedRoute>}
        />

        <Route
          path="/worker/myappointments"
          element={<ProtectedRoute><MyAppointments /></ProtectedRoute>}
        />

        <Route
          path="/worker/myschedule"
          element={<ProtectedRoute><MySchedule /></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
