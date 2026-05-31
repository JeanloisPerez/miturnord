import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import ClientLoginPage from './pages/ClientLoginPage';
import BusinessLoginPage from './pages/BusinessLoginPage';
import ClientRegisterPage from './pages/ClientRegisterPage';
import BusinessRegisterPage from './pages/BusinessRegisterPage';
import DashboardRouter from './components/DashboardRouter';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public home */}
      <Route path="/" element={<HomePage />} />

      {/* Client auth */}
      <Route path="/login" element={<PublicRoute><ClientLoginPage /></PublicRoute>} />
      <Route path="/register/client" element={<PublicRoute><ClientRegisterPage /></PublicRoute>} />

      {/* Business / institution auth */}
      <Route path="/admin/login" element={<PublicRoute><BusinessLoginPage /></PublicRoute>} />
      <Route path="/register/business" element={<PublicRoute><BusinessRegisterPage /></PublicRoute>} />

      {/* Protected dashboard */}
      <Route path="/dashboard/*" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />

      {/* Legacy / fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
