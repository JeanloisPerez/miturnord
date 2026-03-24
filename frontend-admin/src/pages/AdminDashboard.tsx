import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, Activity, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Basic auth check
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <h1 className="text-xl font-bold tracking-tight text-blue-600">MiTurnoRD Admin</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors">
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Activity size={20} />
            <span>System Health</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Users size={20} />
            <span>Institutions</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings size={20} />
            <span>Global Settings</span>
          </a>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard Overview</h2>
            <p className="mt-1 text-gray-500">Welcome to the MiTurnoRD SaaS administration panel.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Institutions</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">--</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">--</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <h3 className="text-xl font-bold text-green-600 mt-2">Operational</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Settings size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center justify-center h-64">
           <LayoutDashboard className="h-12 w-12 text-gray-300 mb-4" />
           <p className="text-gray-500 text-lg">Select a section from the sidebar to begin managing the platform.</p>
        </div>
      </main>
    </div>
  );
}
