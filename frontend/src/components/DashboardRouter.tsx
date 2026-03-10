import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ClientDashboard from '../pages/ClientDashboard';
import OwnerDashboard from '../pages/OwnerDashboard';
import AdminDashboard from '../pages/AdminDashboard';

/** Routes user to the correct dashboard based on their JWT role */
export default function DashboardRouter() {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (user.role === 'INSTITUTION_OWNER') return <OwnerDashboard />;
    if (user.role === 'SAAS_ADMIN') return <AdminDashboard />;
    return <ClientDashboard />;
}
