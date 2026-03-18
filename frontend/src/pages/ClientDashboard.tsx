import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Home, Calendar, User, X, LogOut } from 'lucide-react';

import { getInstitutions, getInstitutionTypes, getAppointments } from '../services/api';
import type { View, InstitutionType, Institution } from '../views/client/clientShared';

import ClientHomeView from '../views/client/ClientHomeView';
import ClientInstitutionDetailView from '../views/client/ClientInstitutionDetailView';
import ClientApptsView from '../views/client/ClientApptsView';
import ClientProfileView from '../views/client/ClientProfileView';

export default function ClientDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Navigation
    const [view, setView] = useState<View>('home');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Global Browse state (kept here so search bar in header works)
    const [iTypes, setITypes] = useState<InstitutionType[]>([]);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [browseLoading, setBrowseLoading] = useState(false);

    // Selected institution id for DetailView
    const [selectedInstId, setSelectedInstId] = useState<string | null>(null);

    // Appointments state (kept here to pass to ApptsView and sidebar badge if we wanted)
    const [myAppts, setMyAppts] = useState<any[]>([]);
    const [apptLoading, setApptLoading] = useState(false);

    // ── Load data ─────────────────────────────────────────────────────────────
    useEffect(() => { loadTypes(); loadInstitutions(); }, []);
    useEffect(() => { if (view === 'appointments') loadMyAppts(); }, [view]);

    const loadTypes = async () => {
        try { setITypes((await getInstitutionTypes()).data); } catch { }
    };

    const loadInstitutions = useCallback(async (q?: string, typeId?: string | null) => {
        setBrowseLoading(true);
        try { setInstitutions((await getInstitutions(q, typeId ?? undefined)).data); }
        catch { setInstitutions([]); }
        finally { setBrowseLoading(false); }
    }, []);

    const loadMyAppts = async () => {
        setApptLoading(true);
        try { setMyAppts((await getAppointments()).data); }
        catch { setMyAppts([]); }
        finally { setApptLoading(false); }
    };

    const openInstitution = (inst: Institution) => {
        setSelectedInstId(inst.id);
        setView('institution');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SIDEBAR
    // ─────────────────────────────────────────────────────────────────────────
    const navItems = [
        { key: 'home' as View, label: 'Inicio', icon: <Home size={18} /> },
        { key: 'appointments' as View, label: 'Mis Turnos', icon: <Calendar size={18} /> },
        { key: 'profile' as View, label: 'Mi Perfil', icon: <User size={18} /> },
    ];

    const Sidebar = ({ mobile = false }) => (
        <aside className={`
            ${mobile ? 'flex' : 'hidden lg:flex'}
            flex-col w-64 shrink-0 border-r border-gray-100 bg-white
            ${mobile ? 'fixed inset-y-0 left-0 z-50 shadow-xl' : 'sticky top-0 h-screen'}
        `}>
            {/* Logo */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <span className="font-black text-xl text-black tracking-tight">MiTurno<span className="text-blue-600">RD</span></span>
                {mobile && (
                    <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                        <X size={18} className="text-gray-600" />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map(item => {
                    const active = view === item.key;
                    return (
                        <button key={item.key} onClick={() => { setView(item.key); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                                ${active ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                            <div className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</div>
                            {item.label}
                            {item.key === 'appointments' && myAppts.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)).length > 0 && (
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                    {myAppts.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)).length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-100">
                <button onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">
                    <LogOut size={16} />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ── TOP BAR ──────────────────────────────────────────────────── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="flex items-center gap-4 px-4 h-14">
                    {/* Hamburger (mobile) */}
                    <button onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition">
                        <Menu size={20} className="text-gray-700" />
                    </button>
                    {/* Logo (mobile) */}
                    <span className="lg:hidden font-black text-lg text-black tracking-tight">
                        MiTurno<span className="text-blue-600">RD</span>
                    </span>
                    {/* Search (full width) */}
                    <div className="flex-1 relative max-w-2xl mx-auto">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); loadInstitutions(e.target.value, activeType); if (view !== 'home') setView('home'); }}
                            placeholder="Buscar instituciones o servicios..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)} />
            )}
            {sidebarOpen && <Sidebar mobile />}

            {/* ── BODY ─────────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                {/* ── MAIN SCROLL AREA ──────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto">

                    {view === 'home' && (
                        <ClientHomeView
                            search={search}
                            institutions={institutions}
                            browseLoading={browseLoading}
                            iTypes={iTypes}
                            activeType={activeType}
                            setActiveType={setActiveType}
                            loadInstitutions={loadInstitutions}
                            onOpenInstitution={openInstitution}
                        />
                    )}

                    {view === 'institution' && selectedInstId && (
                        <ClientInstitutionDetailView
                            institutionId={selectedInstId}
                            onBack={() => setView('home')}
                            onMyAppts={() => setView('appointments')}
                        />
                    )}

                    {view === 'appointments' && (
                        <ClientApptsView
                            myAppts={myAppts}
                            apptLoading={apptLoading}
                            onBookMore={() => setView('home')}
                            loadMyAppts={loadMyAppts}
                        />
                    )}

                    {view === 'profile' && (
                        <ClientProfileView onLogout={() => { logout(); navigate('/login'); }} />
                    )}

                </main>
            </div>
        </div>
    );
}
