import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };


    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                <span className="text-blue-600 font-bold text-base tracking-tight">MiTurnoRD</span>
                <div className="flex items-center gap-4">
                    <button onClick={handleLogout}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
                        Salir
                    </button>
                </div>
            </div>
        </header>
    );
}
