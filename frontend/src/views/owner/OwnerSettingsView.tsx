import { useState, useEffect } from 'react';
import { Globe, Save, Loader2, CheckCircle2, XCircle, Settings, Store, Clock, Calendar } from 'lucide-react';
import { getBusinessRules, updateBusinessRules, getInstitution, updateInstitution, getMe, connectGoogleCalendar, disconnectGoogleCalendar } from '../../services/api';
import { Hdr, btn, ic, Spinner, ImageUploader } from './ownerShared';

export default function OwnerSettingsView({ instId }: { instId: string }) {
    const [activeTab, setActiveTab] = useState<'profile' | 'rules' | 'google-calendar'>('profile');
    
    const [rules, setRules] = useState<any>({ auto_confirm: true, buffer_minutes: 0, max_per_slot: 1, no_show_minutes: 30, advance_book_days: 30 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    
    const [profile, setProfile] = useState({ description: '', phone: '', email: '', logo_url: '', is_public: false });
    const [profileMsg, setProfileMsg] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        // Detect sync status from URL query parameters
        const params = new URLSearchParams(window.location.search);
        const sync = params.get('sync');
        if (sync === 'success') {
            setSyncStatus('success');
            setActiveTab('google-calendar');
            // Clean URL query params without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => setSyncStatus(null), 5000);
        } else if (sync === 'error') {
            setSyncStatus('error');
            setActiveTab('google-calendar');
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => setSyncStatus(null), 5000);
        }

        getBusinessRules(instId).then(r => setRules(r.data)).finally(() => setLoading(false));
        getInstitution(instId).then(r => {
            const d = r.data;
            setProfile({ 
                description: d.description || '', 
                phone: d.phone || '', 
                email: d.email || '', 
                logo_url: d.logo_url || '',
                is_public: d.is_public ?? false 
            });
        });
        getMe().then(r => setUser(r.data)).catch(err => console.error('Error loading active user:', err));
    }, [instId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setMsg('');
        try {
            const res = await updateBusinessRules(instId, rules);
            setRules(res.data); setMsg('ok');
        } catch { setMsg('error'); }
        finally { setSaving(false); setTimeout(() => setMsg(''), 4000); }
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault(); setProfileSaving(true); setProfileMsg('');
        try {
            await updateInstitution(instId, { 
                description: profile.description || undefined, 
                phone: profile.phone || undefined, 
                email: profile.email || undefined, 
                logo_url: profile.logo_url || undefined,
                is_public: profile.is_public
            });
            setProfileMsg('ok');
        } catch { setProfileMsg('error'); }
        finally { setProfileSaving(false); setTimeout(() => setProfileMsg(''), 4000); }
    };

    const handleConnectGoogle = async () => {
        setConnecting(true);
        try {
            const res = await connectGoogleCalendar();
            if (res.data && res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            console.error('Failed to start Google OAuth:', err);
            setSyncStatus('error');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnectGoogle = async () => {
        setConnecting(true);
        try {
            await disconnectGoogleCalendar();
            setUser((u: any) => ({ ...u, google_refresh_token: null, google_access_token: null }));
            setSyncStatus(null);
        } catch (err) {
            console.error('Failed to disconnect Google Calendar:', err);
        } finally {
            setConnecting(false);
        }
    };

    if (loading) return <Spinner />;

    const fields = [
        { key: 'buffer_minutes', label: 'Buffer entre citas', unit: 'min', desc: 'Tiempo inactivo o de descanso requerido entre cada cita agendada.', min: 0, max: 120 },
        { key: 'max_per_slot', label: 'Citas simultáneas', unit: 'citas', desc: 'Capacidad máxima de clientes que pueden agendar a la misma hora exacta.', min: 1, max: 50 },
        { key: 'no_show_minutes', label: 'Tolerancia de espera', unit: 'min', desc: 'Minutos de gracia antes de marcar automáticamente la cita como NO PRESENTADO.', min: 5, max: 120 },
        { key: 'advance_book_days', label: 'Ventana de reserva', unit: 'días', desc: 'Días máximos de anticipación con los que un cliente puede agendar en el futuro.', min: 1, max: 365 }
    ];

    return (
        <div className="space-y-6 max-w-4xl pb-10">
            <Hdr title="Configuración" sub="Administra el perfil de tu institución y los parámetros de agendamiento" />

            {/* Navigation Pills */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl flex-wrap">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <Globe size={16} /> Perfil Público
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'rules' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <Settings size={16} /> Reglas de Reserva
                </button>
                <button
                    onClick={() => setActiveTab('google-calendar')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'google-calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    <Calendar size={16} /> Google Calendar
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'profile' && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Store size={18} /></div>
                        <div>
                            <p className="text-gray-900 font-bold">Perfil de la Empresa</p>
                            <p className="text-gray-500 text-xs mt-0.5">Información visible para los clientes en el portal público</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleProfileSave} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="flex flex-col gap-5">
                                <ImageUploader
                                    label="Logo de la institución"
                                    value={profile.logo_url}
                                    onChange={url => setProfile(p => ({ ...p, logo_url: url }))}
                                />
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción pública</label>
                                    <textarea
                                        value={profile.description}
                                        onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
                                        rows={4} placeholder="Describe los servicios y especialidades de tu institución..."
                                        className={`${ic} resize-none bg-gray-50 focus:bg-white`} />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Teléfono de contacto</label>
                                    <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="Ej: 809-000-0000" className={`${ic} bg-gray-50 focus:bg-white`} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Correo electrónico</label>
                                    <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="contacto@institucion.com" className={`${ic} bg-gray-50 focus:bg-white`} />
                                </div>
                                
                                {/* Marketplace Toggle */}
                                <div className="mt-2 flex items-start justify-between gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                    <div>
                                        <p className="text-blue-900 font-bold text-sm">Visible en el Marketplace</p>
                                        <p className="text-blue-700/80 text-xs mt-1 leading-relaxed">Si está activo, tu negocio será indexado en el buscador público de MiTurnoRD para atraer clientes nuevos.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                        <input type="checkbox" checked={profile.is_public} onChange={e => setProfile(p => ({ ...p, is_public: e.target.checked }))} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 border border-gray-200 peer-checked:border-transparent" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                            <button type="submit" disabled={profileSaving} className={`${btn} flex items-center justify-center gap-2 min-w-[160px]`}>
                                {profileSaving ? <><Loader2 size={16} className="animate-spin" />Guardando...</> : <><Save size={16} />Guardar Cambios</>}
                            </button>
                            {profileMsg === 'ok' && <p className="text-green-600 font-medium text-sm flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg"><CheckCircle2 size={16} />Perfil actualizado con éxito</p>}
                            {profileMsg === 'error' && <p className="text-red-500 font-medium text-sm flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg"><XCircle size={16} />Error al guardar cambios</p>}
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Clock size={18} /></div>
                        <div>
                            <p className="text-gray-900 font-bold">Reglas Operativas</p>
                            <p className="text-gray-500 text-xs mt-0.5">Define cómo se comporta el motor al recibir y procesar citas</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="p-6">
                        {/* Auto Confirm Toggle */}
                        <div className="flex items-start justify-between gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100 mb-8">
                            <div>
                                <p className="text-gray-900 font-bold text-sm">Confirmación Automática de Citas</p>
                                <p className="text-gray-500 text-xs mt-1 leading-relaxed max-w-lg">Si está activo, las citas agendadas por los clientes pasarán al estado CONFIRMADA instantáneamente sin requerir validación manual tuya.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                <input type="checkbox" checked={rules.auto_confirm} onChange={e => setRules((r: any) => ({ ...r, auto_confirm: e.target.checked }))} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 border border-gray-200 peer-checked:border-transparent" />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                            {fields.map(({ key, label, unit, desc, min, max }) => (
                                <div key={key}>
                                    <label className="block text-sm font-bold text-gray-800 mb-1">{label}</label>
                                    <p className="text-gray-500 text-xs mb-3 h-8 leading-relaxed pr-4">{desc}</p>
                                    <div className="relative w-max">
                                        <input type="number" min={min} max={max} value={rules[key]} onChange={e => setRules((r: any) => ({ ...r, [key]: Number(e.target.value) }))} className={`${ic} w-32 pl-4 pr-12 font-semibold text-gray-900 bg-gray-50 focus:bg-white transition-colors`} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold uppercase">{unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                            <button type="submit" disabled={saving} className={`${btn} flex items-center justify-center gap-2 min-w-[160px]`}>
                                {saving ? <><Loader2 size={16} className="animate-spin" />Guardando...</> : <><Save size={16} />Guardar Reglas</>}
                            </button>
                            {msg === 'ok' && <p className="text-green-600 font-medium text-sm flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg"><CheckCircle2 size={16} />Reglas actualizadas con éxito</p>}
                            {msg === 'error' && <p className="text-red-500 font-medium text-sm flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg"><XCircle size={16} />Error al actualizar Reglas</p>}
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'google-calendar' && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Calendar size={18} /></div>
                        <div>
                            <p className="text-gray-900 font-bold">Google Calendar</p>
                            <p className="text-gray-500 text-xs mt-0.5">Sincroniza tus citas de MiTurnoRD con tu calendario de Google</p>
                        </div>
                    </div>

                    <div className="p-6 max-w-2xl">
                        {syncStatus === 'success' && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="text-green-600 shrink-0" size={20} />
                                <div>
                                    <p className="font-bold text-sm">¡Conexión Exitosa!</p>
                                    <p className="text-xs text-green-700 mt-0.5">Tu cuenta ha sido vinculada correctamente. Las nuevas citas confirmadas aparecerán en tu Google Calendar.</p>
                                </div>
                            </div>
                        )}

                        {syncStatus === 'error' && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
                                <XCircle className="text-red-600 shrink-0" size={20} />
                                <div>
                                    <p className="font-bold text-sm">Error de sincronización</p>
                                    <p className="text-xs text-red-700 mt-0.5">Hubo un problema al conectar con Google. Por favor, inténtalo de nuevo.</p>
                                </div>
                            </div>
                        )}

                        {user?.google_refresh_token ? (
                            <div className="space-y-6">
                                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-blue-100 shrink-0">
                                            <svg className="w-6 h-6" viewBox="0 0 48 48">
                                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                                <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.77H24v9.03h12.75c-.53 2.87-2.13 5.31-4.5 6.9l7.02 5.44C43.38 36.31 46.5 30.82 46.5 24z"/>
                                                <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.02-5.44c-1.97 1.33-4.52 2.13-8.87 2.13-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-blue-950 font-bold text-base flex items-center gap-2">
                                                Calendario Sincronizado
                                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                            </p>
                                            <p className="text-blue-700/80 text-xs mt-0.5">Tus citas se están sincronizando automáticamente con tu cuenta de Google.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleDisconnectGoogle} 
                                        disabled={connecting}
                                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors text-xs font-bold rounded-xl"
                                    >
                                        {connecting ? 'Desconectando...' : 'Desconectar Cuenta'}
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Detalles de la Integración</h4>
                                    <ul className="space-y-3 text-xs text-gray-600 list-disc list-inside">
                                        <li>Las citas confirmadas en MiTurnoRD se programarán automáticamente en tu Google Calendar principal.</li>
                                        <li>Si reagendas o cambias el horario de una cita en el portal, el evento en Google Calendar se actualizará al instante.</li>
                                        <li>Los bloques manuales o citas personales que programes en tu Google Calendar serán leídos para evitar que clientes reserven en esas horas ocupadas.</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 mb-6 text-gray-400">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg mb-2">Conecta tu Calendario</h3>
                                <p className="text-gray-500 text-xs leading-relaxed max-w-sm mb-6">
                                    Sincroniza tus citas de MiTurnoRD con tu Google Calendar de forma bidireccional para gestionar todo tu tiempo en un solo lugar y evitar sobreventas.
                                </p>
                                <button
                                    onClick={handleConnectGoogle}
                                    disabled={connecting}
                                    className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 animate-bounce"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                        <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.77H24v9.03h12.75c-.53 2.87-2.13 5.31-4.5 6.9l7.02 5.44C43.38 36.31 46.5 30.82 46.5 24z"/>
                                        <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.02-5.44c-1.97 1.33-4.52 2.13-8.87 2.13-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                    </svg>
                                    {connecting ? 'Iniciando conexión...' : 'Conectar con Google Calendar'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
