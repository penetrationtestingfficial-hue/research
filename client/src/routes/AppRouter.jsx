import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { TelemetryProvider } from '../context/TelemetryContext';

import LandingPage from '../pages/LandingPage';
import TraditionalLoginPage from '../pages/TraditionalLoginPage';
import DIDLoginPage from '../pages/DIDLoginPage';
import DashboardPage from '../pages/DashboardPage';
import AdminPage from '../pages/AdminPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TelemetryProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login/traditional" element={<TraditionalLoginPage />} />
            <Route path="/login/did" element={<DIDLoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TelemetryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;