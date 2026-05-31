import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Home, Calendar, User, X, LogOut, Star } from 'lucide-react';

import { getInstitutions, getInstitutionTypes, getAppointments, createReview } from '../services/api';
import type { View, InstitutionType, Institution } from '../views/client/clientShared';

import ClientHomeView from '../views/client/ClientHomeView';
import ClientInstitutionDetailView from '../views/client/ClientInstitutionDetailView';
import ClientApptsView from '../views/client/ClientApptsView';
import ClientProfileView from '../views/client/ClientProfileView';
import ClientSearchView from '../views/client/ClientSearchView';

export default function ClientDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Navigation
    const [view, setView] = useState<View>('home');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Home view browse state
    const [iTypes, setITypes] = useState<InstitutionType[]>([]);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [browseLoading, setBrowseLoading] = useState(false);

    // Search state
    const [searchInput, setSearchInput] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');

    // Selected institution id for DetailView
    const [selectedInstId, setSelectedInstId] = useState<string | null>(null);

    // Appointments state
    const [myAppts, setMyAppts] = useState<any[]>([]);
    const [apptLoading, setApptLoading] = useState(false);

    // Reviews states
    const [reviewPromptAppt, setReviewPromptAppt] = useState<any | null>(null);
    const [promptRating, setPromptRating] = useState<number>(0);
    const [promptHoverRating, setPromptHoverRating] = useState<number>(0);
    const [promptComment, setPromptComment] = useState<string>('');
    const [submittingPromptReview, setSubmittingPromptReview] = useState<boolean>(false);
    const [promptError, setPromptError] = useState<string>('');

    // ── Load data ─────────────────────────────────────────────────────────────
    
    // Load types and appointments on mount
    useEffect(() => { 
        loadTypes(); 
        loadMyAppts();
    }, []);

    // Effect to check for unreviewed completed appointments and prompt the user
    useEffect(() => {
        if (!myAppts || myAppts.length === 0) return;
        const unreviewed = myAppts.find(a => a.status === 'COMPLETED' && !a.review);
        if (unreviewed) {
            const dismissedKey = `dismissed_review_${unreviewed.id}`;
            if (!localStorage.getItem(dismissedKey)) {
                setReviewPromptAppt(unreviewed);
                setPromptRating(0);
                setPromptComment('');
                setPromptError('');
            }
        }
    }, [myAppts]);

    const handlePromptReviewSubmit = async () => {
        if (!reviewPromptAppt || promptRating === 0) return;
        setSubmittingPromptReview(true);
        setPromptError('');
        try {
            await createReview(reviewPromptAppt.id, promptRating, promptComment);
            await loadMyAppts(); // Reload to update state
            setReviewPromptAppt(null);
        } catch (err: any) {
            setPromptError(err.response?.data?.message || 'Error al enviar valoración.');
        } finally {
            setSubmittingPromptReview(false);
        }
    };

    const handlePromptReviewDismiss = () => {
        if (reviewPromptAppt) {
            localStorage.setItem(`dismissed_review_${reviewPromptAppt.id}`, 'true');
            setReviewPromptAppt(null);
        }
    };
    
    // Reload institutions for home view whenever activeType changes (no search query applied here)
    useEffect(() => {
        loadInstitutions(undefined, activeType);
    }, [activeType]);

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

    const handleSearchSubmit = () => {
        if (!searchInput.trim()) {
            setView('home');
            return;
        }
        setSubmittedSearch(searchInput);
        setView('search');
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
                    {/* Header Search Bar */}
                    <div className="flex-1 relative max-w-2xl mx-auto">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(); }}
                            placeholder="Buscar en el catálogo (Ej: Odontólogo, Dr. Carlos...)"
                            className="w-full pl-10 pr-24 py-2 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <button 
                            onClick={handleSearchSubmit}
                            className="absolute right-1 top-1 bottom-1 px-4 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition"
                        >
                            Buscar
                        </button>
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
                            institutions={institutions}
                            browseLoading={browseLoading}
                            iTypes={iTypes}
                            activeType={activeType}
                            setActiveType={setActiveType}
                            loadInstitutions={loadInstitutions}
                            onOpenInstitution={openInstitution}
                        />
                    )}

                    {view === 'search' && (
                        <ClientSearchView 
                            searchQuery={submittedSearch}
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

            {/* Modal de valoración emergente (pop-up) */}
            {reviewPromptAppt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative border border-gray-100">
                        {/* Cerrar */}
                        <button onClick={handlePromptReviewDismiss} className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                            <X size={16} className="text-gray-500" />
                        </button>

                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-inner">
                                <Star size={32} className="fill-blue-100" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">¿Cómo fue tu experiencia?</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    Tu cita de <span className="font-bold text-gray-900">{reviewPromptAppt.service?.name}</span> en <span className="font-bold text-gray-900">{reviewPromptAppt.institution?.name}</span> ha finalizado. ¡Queremos saber qué tal te fue!
                                </p>
                            </div>

                            {/* Stars interaction */}
                            <div className="flex justify-center gap-2 py-2">
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const active = (promptHoverRating || promptRating) >= star;
                                    return (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setPromptRating(star)}
                                            onMouseEnter={() => setPromptHoverRating(star)}
                                            onMouseLeave={() => setPromptHoverRating(0)}
                                            className="focus:outline-none transition-transform hover:scale-125 duration-100 active:scale-95"
                                        >
                                            <Star
                                                size={36}
                                                className={`transition-colors duration-200 ${
                                                    active 
                                                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                                                        : 'text-gray-200 fill-transparent hover:text-amber-300'
                                                }`}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Comment */}
                            <div className="text-left space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Escribe tu reseña <span className="text-gray-400 font-medium">(opcional)</span></label>
                                <textarea
                                    value={promptComment}
                                    onChange={(e) => setPromptComment(e.target.value)}
                                    rows={3}
                                    placeholder="Comparte tu opinión sobre la atención, puntualidad o instalaciones..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            {promptError && (
                                <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 p-3 rounded-xl">{promptError}</p>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handlePromptReviewDismiss}
                                    className="flex-1 py-4 border-2 border-gray-100 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-[20px] transition-colors"
                                >
                                    Omitir
                                </button>
                                <button
                                    onClick={handlePromptReviewSubmit}
                                    disabled={promptRating === 0 || submittingPromptReview}
                                    className="flex-[2] py-4 bg-black hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-black text-white font-black text-sm rounded-[20px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                                >
                                    {submittingPromptReview ? 'Enviando...' : 'Enviar valoración'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

