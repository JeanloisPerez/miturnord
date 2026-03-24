import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Settings, LogOut, ShieldAlert } from 'lucide-react';
import AdminLogin from './pages/AdminLogin';
import OverviewPage from './pages/OverviewPage';
import InstitutionsPage from './pages/InstitutionsPage';
import UsersPage from './pages/UsersPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import './App.css';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  const navItem = 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all';
  const active = 'bg-blue-600 text-white shadow-sm';
  const inactive = 'text-gray-600 hover:bg-gray-100';

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
          <ShieldAlert className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-gray-900 text-sm">MiTurnoRD Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/dashboard" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
            <LayoutDashboard size={18} /> Overview
          </NavLink>
          <NavLink to="/institutions" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
            <Building2 size={18} /> Instituciones
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
            <Users size={18} /> Usuarios
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `${navItem} ${isActive ? active : inactive}`}>
            <Settings size={18} /> Configuración
          </NavLink>
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<RequireAuth><AdminLayout><OverviewPage /></AdminLayout></RequireAuth>} />
        <Route path="/institutions" element={<RequireAuth><AdminLayout><InstitutionsPage /></AdminLayout></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><AdminLayout><UsersPage /></AdminLayout></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><AdminLayout><SystemSettingsPage /></AdminLayout></RequireAuth>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
