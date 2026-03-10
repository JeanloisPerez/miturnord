import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getInstitution, getAppointmentsByInstitution, updateAppointment, getServicesByInstitution, createService, updateService, deleteService, getSchedulesByInstitution, createSchedule, deleteSchedule, getBranches, createBranch, updateBranch, getBusinessRules, updateBusinessRules, getReports, getInstitutionClients } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { MapLocation } from '../components/MapPicker';
import { LayoutDashboard, CalendarDays, Building2, Wrench, Clock, Users, BarChart2, Settings, CheckCircle2, XCircle, AlertCircle, RefreshCw, MinusCircle, Eye, EyeOff, Phone, ChevronDown, ChevronUp, Loader2, Trash2, Plus, List, Columns, MapPin, TrendingUp, TrendingDown, Zap, Power, Search, ToggleLeft, ToggleRight } from 'lucide-react';
const MapPicker = lazy(() => import('../components/MapPicker'));

type View = 'overview' | 'appointments' | 'branches' | 'services' | 'schedules' | 'clients' | 'reports' | 'settings';

const SC: Record<string, string> = { PENDING: 'bg-amber-50 text-amber-700 border-amber-200', CONFIRMED: 'bg-green-50 text-green-700 border-green-200', CANCELLED: 'bg-red-50 text-red-700 border-red-200', COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200', NO_SHOW: 'bg-gray-100 text-gray-500 border-gray-200', RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-200' };
const SL: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Completada', NO_SHOW: 'No se presentó', RESCHEDULED: 'Reprogramada' };
const SI: Record<string, React.ReactNode> = { PENDING: <AlertCircle size={11} />, CONFIRMED: <CheckCircle2 size={11} />, CANCELLED: <XCircle size={11} />, COMPLETED: <CheckCircle2 size={11} />, NO_SHOW: <MinusCircle size={11} />, RESCHEDULED: <RefreshCw size={11} /> };
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const STO = ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
const KANBAN_COLS = [['PENDING', 'Pendiente'], ['CONFIRMED', 'Confirmada'], ['COMPLETED', 'Completada'], ['CANCELLED', 'Cancelada']];
const ic = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition';
const btn = 'bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition';
const NAV: { key: View; label: string; Icon: React.ElementType }[] = [
    { key: 'overview', label: 'Dashboard', Icon: LayoutDashboard }, { key: 'appointments', label: 'Citas', Icon: CalendarDays },
    { key: 'branches', label: 'Sucursales', Icon: Building2 }, { key: 'services', label: 'Servicios', Icon: Wrench },
    { key: 'schedules', label: 'Horarios', Icon: Clock }, { key: 'clients', label: 'Clientes', Icon: Users },
    { key: 'reports', label: 'Reportes', Icon: BarChart2 }, { key: 'settings', label: 'Configuración', Icon: Settings },
];

function Spinner() { return <div className="py-16 flex items-center justify-center"><Loader2 size={20} className="text-blue-400 animate-spin" /></div>; }
function Empty({ msg }: { msg: string }) { return <div className="bg-white border border-gray-100 rounded-xl py-14 text-center text-gray-400 text-sm">{msg}</div>; }
function Hdr({ title, sub }: { title: string; sub: string }) { return <div><h1 className="text-xl font-bold text-gray-900">{title}</h1><p className="text-gray-400 text-sm mt-0.5">{sub}</p></div>; }
function Badge({ status }: { status: string }) { return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${SC[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{SI[status]}{SL[status] ?? status}</span>; }

function initials(name: string) { const p = name?.trim().split(' '); return p?.length > 1 ? `${p[0][0]}${p[1][0]}` : (p[0]?.[0] ?? '?'); }
const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'];
function Avatar({ name, size = 8 }: { name: string; size?: number }) { const i = name.charCodeAt(0) % AVATAR_COLORS.length; return <div className={`w-${size} h-${size} ${AVATAR_COLORS[i]} rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0`}>{initials(name)}</div>; }

export default function OwnerDashboard() {
    const { user } = useAuth(); const instId = user?.institutionId;
    const [view, setView] = useState<View>('overview');
    const [inst, setInst] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => { if (!instId) return; getInstitution(instId).then(r => setInst(r.data)).finally(() => setLoading(false)); }, [instId]);
    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={20} className="text-blue-400 animate-spin" /></div>;
    if (!instId) return <div className="min-h-screen flex items-center justify-center text-red-500 text-sm">Sin institución asignada.</div>;
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex">
                <aside className="w-56 min-h-[calc(100vh-56px)] bg-white border-r border-gray-200 flex flex-col py-4 shrink-0">
                    <div className="px-4 mb-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Institución</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{inst?.name}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs border ${inst?.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{inst?.status === 'active' ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    <nav className="flex-1">{NAV.map(({ key, label, Icon }) => (
                        <button key={key} onClick={() => setView(key)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${view === key ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <Icon size={15} className="shrink-0" />{label}
                        </button>
                    ))}</nav>
                </aside>
                <main className="flex-1 p-6 overflow-auto min-w-0">
                    {view === 'overview' && <OverviewView instId={instId} />}
                    {view === 'appointments' && <AppointmentsView instId={instId} />}
                    {view === 'branches' && <BranchesView instId={instId} />}
                    {view === 'services' && <ServicesView instId={instId} />}
                    {view === 'schedules' && <SchedulesView instId={instId} />}
                    {view === 'clients' && <ClientsView instId={instId} />}
                    {view === 'reports' && <ReportsView instId={instId} />}
                    {view === 'settings' && <SettingsView instId={instId} />}
                </main>
            </div>
        </div>
    );
}

/* ── OVERVIEW ── */
function OverviewView({ instId }: { instId: string }) {
    const [report, setReport] = useState<any>(null);
    const [todayAppts, setTodayAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const today = new Date().toISOString().split('T')[0];
    useEffect(() => {
        Promise.all([getReports(instId, 'week'), getAppointmentsByInstitution(instId, { date: today })])
            .then(([r, a]) => { setReport(r.data); setTodayAppts(a.data); })
            .finally(() => setLoading(false));
    }, [instId]);
    if (loading) return <Spinner />;
    const pending = todayAppts.filter(a => a.status === 'PENDING');
    const revenue = todayAppts.filter(a => a.status === 'COMPLETED').reduce((s, a) => s + Number(a.service?.price || 0), 0);
    const kpis = [
        { label: 'Citas hoy', val: todayAppts.length, sub: `${pending.length} pendientes`, Icon: CalendarDays, color: 'blue' },
        { label: 'Confirmadas', val: todayAppts.filter(a => a.status === 'CONFIRMED').length, sub: 'de hoy', Icon: CheckCircle2, color: 'green' },
        { label: 'Completadas', val: todayAppts.filter(a => a.status === 'COMPLETED').length, sub: 'de hoy', Icon: Zap, color: 'violet' },
    ];
    const colorMap: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', violet: 'bg-violet-50 text-violet-600', emerald: 'bg-emerald-50 text-emerald-600' };
    const sorted = [...todayAppts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (
        <div className="space-y-5 max-w-6xl">
            {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <p className="text-amber-800 font-medium text-sm">{pending.length} cita{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''} de confirmación</p>
                    </div>
                    <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"><CheckCircle2 size={13} />Revisar</button>
                </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className={`w-9 h-9 rounded-lg ${colorMap[k.color]} flex items-center justify-center mb-3`}><k.Icon size={17} /></div>
                        <p className="text-2xl font-bold text-gray-900">{k.val}</p>
                        <p className="text-gray-800 text-sm font-medium mt-0.5">{k.label}</p>
                        <p className="text-gray-400 text-xs">{k.sub}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-800 font-semibold text-sm mb-4">Agenda de hoy — {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    {sorted.length === 0 ? <Empty msg="Sin citas para hoy" /> : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {sorted.map(a => (
                                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${SC[a.status] ?? 'border-gray-100'} bg-opacity-30`}>
                                    <div className="text-center shrink-0 w-14">
                                        <p className="text-xs font-bold text-gray-700">{new Date(a.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 font-semibold text-sm truncate">{a.user?.full_name}</p>
                                        <p className="text-gray-500 text-xs truncate">{a.service?.name} · {a.service?.duration} min</p>
                                    </div>
                                    <Badge status={a.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-800 font-semibold text-sm mb-4">Top servicios (semana)</p>
                    <div className="space-y-3">
                        {(report?.topServices ?? []).slice(0, 6).map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                                <div className="flex-1">
                                    <p className="text-gray-700 text-sm truncate">{s.name}</p>
                                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((s.count / (report.topServices[0]?.count || 1)) * 100, 100)}%` }} />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium w-4 text-right">{s.count}</span>
                            </div>
                        ))}
                        {(report?.topServices ?? []).length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sin datos</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── APPOINTMENTS KANBAN ── */
function AppointmentsView({ instId }: { instId: string }) {
    const [appts, setAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const load = useCallback(() => {
        setLoading(true);
        getAppointmentsByInstitution(instId, { status: statusFilter || undefined }).then(r => setAppts(r.data)).finally(() => setLoading(false));
    }, [instId, statusFilter]);
    useEffect(() => { load(); }, [load]);
    const handleStatus = async (id: string, status: string) => {
        await updateAppointment(id, { status });
        setAppts(p => p.map(a => a.id === id ? { ...a, status } : a));
    };
    const filtered = appts.filter(a => !search || a.user?.full_name?.toLowerCase().includes(search.toLowerCase()) || a.service?.name?.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="space-y-4 max-w-full">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Hdr title="Citas" sub="Gestiona todas las citas de tu institución" />
                <div className="flex items-center gap-2">
                    <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${viewMode === 'kanban' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Columns size={13} />Kanban</button>
                    <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><List size={13} />Lista</button>
                </div>
            </div>
            <div className="flex gap-3 flex-wrap">
                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48" /></div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Todos los estados</option>
                    {STO.map(s => <option key={s} value={s}>{SL[s]}</option>)}
                </select>
            </div>
            {loading ? <Spinner /> : viewMode === 'kanban' ? (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {KANBAN_COLS.map(([status, label]) => {
                        const col = filtered.filter(a => a.status === status);
                        return (
                            <div key={status} className="shrink-0 w-72">
                                <div className={`flex items-center justify-between mb-3 px-1`}>
                                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${SC[status]}`}>{col.length}</span>
                                </div>
                                <div className="space-y-3 min-h-24">
                                    {col.map(a => (
                                        <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-2 mb-3">
                                                <Avatar name={a.user?.full_name || '?'} size={8} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-900 font-semibold text-sm truncate">{a.user?.full_name}</p>
                                                    <p className="text-gray-500 text-xs truncate">{a.service?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                                <Clock size={11} />
                                                {new Date(a.date).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })} · {new Date(a.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <select value={a.status} onChange={e => handleStatus(a.id, e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                                                {STO.map(s => <option key={s} value={s}>{SL[s]}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                    {col.length === 0 && <div className="border-2 border-dashed border-gray-100 rounded-xl h-20 flex items-center justify-center text-gray-300 text-xs">Sin citas</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                filtered.length === 0 ? <Empty msg="Sin citas" /> : (
                    <div className="space-y-3">
                        {filtered.map(a => (
                            <div key={a.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap">
                                <Avatar name={a.user?.full_name || '?'} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 font-semibold text-sm">{a.user?.full_name}</p>
                                    <p className="text-gray-500 text-xs">{a.service?.name} · {new Date(a.date).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                </div>
                                <Badge status={a.status} />
                                <select value={a.status} onChange={e => handleStatus(a.id, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white">
                                    {STO.map(s => <option key={s} value={s}>{SL[s]}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

/* ── SERVICES CARDS ── */
function ServicesView({ instId }: { instId: string }) {
    const [svcs, setSvcs] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', duration: '30', price: '', description: '' });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    useEffect(() => { getServicesByInstitution(instId).then(r => setSvcs(r.data)).finally(() => setLoading(false)); }, [instId]);
    const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); setMsg(''); try { const res = await createService({ name: form.name, description: form.description, duration: Number(form.duration), price: form.price ? Number(form.price) : undefined, institution_id: instId, is_active: true }); setSvcs(s => [...s, res.data]); setForm({ name: '', duration: '30', price: '', description: '' }); setMsg('ok'); setShowForm(false); } catch (err: any) { setMsg('error'); } };
    const toggleActive = async (id: string, is_active: boolean) => { await updateService(id, { is_active }); setSvcs(s => s.map(x => x.id === id ? { ...x, is_active } : x)); };
    const handleDel = async (id: string) => { if (!confirm('¿Eliminar?')) return; await deleteService(id); setSvcs(s => s.filter(x => x.id !== id)); };
    const topId = svcs.reduce((top, s, _, arr) => arr.find(x => x.id === top)?.appointmentCount > s.appointmentCount ? top : s.id, svcs[0]?.id);
    return (
        <div className="space-y-5 max-w-5xl">
            <div className="flex items-center justify-between gap-4">
                <Hdr title="Servicios" sub="Administra los servicios que ofreces" />
                <button onClick={() => setShowForm(v => !v)} className={`${btn} flex items-center gap-1.5`}><Plus size={15} />{showForm ? 'Cancelar' : 'Nuevo Servicio'}</button>
            </div>
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-800 font-semibold text-sm mb-4">Nuevo Servicio</p>
                    <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ej: Consulta General" className={ic} /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Duración (min) *</label><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} required min="5" className={ic} /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Precio RD$</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" className={ic} /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción breve" className={ic} /></div>
                        {msg === 'ok' && <p className="col-span-2 text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />Creado.</p>}
                        {msg === 'error' && <p className="col-span-2 text-red-500 text-sm">Error al crear.</p>}
                        <button type="submit" className={`${btn} col-span-2`}>Crear Servicio</button>
                    </form>
                </div>
            )}
            {loading ? <Spinner /> : svcs.length === 0 ? <Empty msg="Sin servicios aún" /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {svcs.map(s => (
                        <div key={s.id} className={`bg-white border rounded-xl p-5 transition-all ${s.is_active !== false ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Wrench size={16} className="text-blue-600" /></div>
                                <div className="flex items-center gap-2">
                                    {s.id === topId && svcs.length > 1 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 font-medium">Popular</span>}
                                    <button onClick={() => toggleActive(s.id, !(s.is_active !== false))} className="text-gray-400 hover:text-blue-500 transition">{s.is_active !== false ? <ToggleRight size={20} className="text-blue-500" /> : <ToggleLeft size={20} />}</button>
                                </div>
                            </div>
                            <p className="text-gray-900 font-bold text-base">{s.name}</p>
                            {s.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{s.description}</p>}
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                                <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{s.duration} min</span>
                                {s.price && <span className="text-blue-700 text-sm font-bold">RD${Number(s.price).toFixed(0)}</span>}
                                <button onClick={() => handleDel(s.id)} className="ml-auto text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── SCHEDULES ── */
function SchedulesView({ instId }: { instId: string }) {
    const [scheds, setScheds] = useState<any[]>([]);
    const [form, setForm] = useState({ day_of_week: '1', start_time: '08:00', end_time: '17:00' });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => { getSchedulesByInstitution(instId).then(r => setScheds(r.data)).finally(() => setLoading(false)); }, [instId]);
    const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); setMsg(''); try { const res = await createSchedule({ institution_id: instId, day_of_week: Number(form.day_of_week), start_time: form.start_time, end_time: form.end_time }); setScheds(s => [...s, res.data]); setMsg('ok'); } catch (err: any) { setMsg('error'); } };
    const handleDel = async (id: string) => { if (!confirm('¿Eliminar?')) return; await deleteSchedule(id); setScheds(s => s.filter(x => x.id !== id)); };
    return (
        <div className="space-y-5 max-w-4xl">
            <Hdr title="Horarios" sub="Define los días y horas de atención por sucursal" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-800 font-semibold text-sm mb-4">Agregar Horario</p>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Día</label><select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))} className={ic}>{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Apertura</label><input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={ic} /></div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Cierre</label><input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={ic} /></div>
                        </div>
                        {msg === 'ok' && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />Guardado.</p>}
                        {msg === 'error' && <p className="text-red-500 text-sm">Error al guardar.</p>}
                        <button type="submit" className={`${btn} w-full flex items-center justify-center gap-2`}><Plus size={15} />Guardar</button>
                    </form>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-800 font-semibold text-sm mb-4">Horarios activos</p>
                    {loading ? <Spinner /> : (
                        <div className="space-y-2">
                            {DAYS.map((d, i) => {
                                const sch = scheds.find(s => s.day_of_week === i); return (
                                    <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${sch ? 'border-blue-100 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${sch ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <p className={`text-sm font-semibold ${sch ? 'text-gray-800' : 'text-gray-400'}`}>{d}</p>
                                        </div>
                                        {sch ? (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-blue-700 font-medium">{sch.start_time} – {sch.end_time}</span>
                                                <button onClick={() => handleDel(sch.id)} className="text-red-400 hover:text-red-600 transition"><XCircle size={14} /></button>
                                            </div>
                                        ) : <span className="text-gray-300 text-xs">Cerrado</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── CLIENTS CRM ── */
function ClientsView({ instId }: { instId: string }) {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    useEffect(() => { getInstitutionClients(instId).then(r => setClients(r.data)).finally(() => setLoading(false)); }, [instId]);
    const filtered = clients.filter(c => !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));
    if (loading) return <Spinner />;
    return (
        <div className="space-y-5 max-w-4xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Hdr title="Clientes" sub={`${clients.length} clientes han agendado contigo`} />
                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-52" /></div>
            </div>
            {filtered.length === 0 ? <Empty msg="Sin clientes" /> : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span className="col-span-4">Cliente</span><span className="col-span-2 text-center">Visitas</span><span className="col-span-3">Última cita</span><span className="col-span-3">Estado último</span>
                    </div>
                    {filtered.map(c => {
                        const last = c.appointments?.[c.appointments.length - 1];
                        return (
                            <div key={c.id} className="border-b border-gray-50 last:border-0">
                                <button className="w-full grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50 transition text-left gap-2" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                                    <div className="col-span-4 flex items-center gap-3"><Avatar name={c.full_name || '?'} /><div><p className="text-gray-900 font-semibold text-sm">{c.full_name}</p><p className="text-gray-400 text-xs truncate">{c.email}</p></div></div>
                                    <span className="col-span-2 text-center text-gray-600 font-bold text-sm">{c.appointments?.length ?? 0}</span>
                                    <span className="col-span-3 text-gray-500 text-xs">{last ? new Date(last.date).toLocaleDateString('es-DO', { dateStyle: 'medium' }) : '—'}</span>
                                    <div className="col-span-3 flex items-center justify-between">{last ? <Badge status={last.status} /> : <span className="text-gray-300 text-xs">—</span>}{expanded === c.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}</div>
                                </button>
                                {expanded === c.id && (
                                    <div className="px-5 pb-4">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Historial de citas</p>
                                        <div className="space-y-1.5">
                                            {(c.appointments ?? []).map((a: any) => (
                                                <div key={a.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                                                    <span className="text-gray-600 font-medium">{a.service}</span>
                                                    <span className="text-gray-400">{new Date(a.date).toLocaleDateString('es-DO', { dateStyle: 'medium' })}</span>
                                                    <Badge status={a.status} />
                                                </div>
                                            ))}
                                            {(c.appointments ?? []).length === 0 && <p className="text-gray-400 text-xs py-2">Sin historial</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── REPORTS ── */
function ReportsView({ instId }: { instId: string }) {
    const [range, setRange] = useState<'week' | 'month'>('week');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => { setLoading(true); getReports(instId, range).then(r => setReport(r.data)).finally(() => setLoading(false)); }, [instId, range]);
    const revenue = (report?.range?.completedTotal ?? 0);
    const statusItems = report ? Object.entries(report.range?.statusCounts ?? {}).filter(([, v]) => (v as number) > 0) : [];
    return (
        <div className="space-y-5 max-w-5xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Hdr title="Reportes" sub="Analiza el rendimiento de tu institución" />
                <div className="flex gap-2">
                    {(['week', 'month'] as const).map(r => <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${range === r ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{r === 'week' ? 'Semana' : 'Mes'}</button>)}
                </div>
            </div>
            {loading ? <Spinner /> : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total citas', val: report?.range?.total ?? 0, Icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
                            { label: 'Confirmadas', val: report?.range?.statusCounts?.CONFIRMED ?? 0, Icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
                            { label: 'Canceladas', val: report?.range?.statusCounts?.CANCELLED ?? 0, Icon: XCircle, color: 'text-red-500 bg-red-50' },
                            { label: 'Clientes únicos', val: report?.range?.uniqueClients ?? 0, Icon: Users, color: 'text-violet-600 bg-violet-50' },
                        ].map(s => (
                            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
                                <div className={`w-8 h-8 rounded-lg ${s.color.split(' ')[1]} flex items-center justify-center mb-3`}><s.Icon size={15} className={s.color.split(' ')[0]} /></div>
                                <p className="text-2xl font-bold text-gray-900">{s.val}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                            <p className="text-gray-800 font-semibold text-sm mb-4">Citas por día</p>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={report?.byDay ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={d => new Date(d).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' })} />
                                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                                    <Tooltip formatter={val => [`${val} citas`, '']} labelFormatter={d => new Date(d).toLocaleDateString('es-DO', { dateStyle: 'medium' })} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Por estado</p>
                                <div className="space-y-2">
                                    {statusItems.map(([s, c]) => <div key={s} className="flex items-center justify-between text-sm"><Badge status={s} /><span className="text-gray-600 font-semibold">{String(c)}</span></div>)}
                                    {statusItems.length === 0 && <p className="text-gray-400 text-xs text-center py-2">Sin datos</p>}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Top servicios</p>
                                <div className="space-y-2">
                                    {(report?.topServices ?? []).slice(0, 4).map((s: any) => (
                                        <div key={s.name} className="flex items-center gap-2">
                                            <p className="text-xs text-gray-600 flex-1 truncate">{s.name}</p>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((s.count / (report.topServices[0]?.count || 1)) * 100, 100)}%` }} /></div>
                                            <span className="text-xs text-gray-500 w-4 text-right">{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ── BRANCHES ── */
function BranchesView({ instId }: { instId: string }) {
    const [branches, setBranches] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', city: '', phone: '', is_main: false });
    const [mapLoc, setMapLoc] = useState<MapLocation | null>(null);
    const [msg, setMsg] = useState(''); const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedMap, setExpandedMap] = useState<string | null>(null);
    useEffect(() => { getBranches(instId).then(r => setBranches(r.data)).finally(() => setLoading(false)); }, [instId]);
    const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); setError(''); try { const res = await createBranch({ institution_id: instId, name: form.name, city: form.city || undefined, phone: form.phone || undefined, is_main: form.is_main, address: mapLoc?.address || undefined, latitude: mapLoc?.lat || undefined, longitude: mapLoc?.lng || undefined }); setBranches(b => [...b, res.data]); setForm({ name: '', city: '', phone: '', is_main: false }); setMapLoc(null); setMsg('Sucursal creada.'); setTimeout(() => setMsg(''), 4000); } catch (err: any) { setError(err.response?.data?.message || 'Error'); } };
    const handleDel = async (id: string) => { if (!confirm('¿Desactivar?')) return; await updateBranch(id, { active: false }); setBranches(b => b.filter(x => x.id !== id)); };
    return (
        <div className="space-y-6 max-w-5xl">
            <Hdr title="Sucursales" sub="Gestiona las sedes de tu institución" />
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100"><p className="text-gray-800 font-semibold text-sm">Nueva Sucursal</p><p className="text-gray-400 text-xs mt-0.5">Busca la dirección o haz clic en el mapa</p></div>
                <div className="p-5">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ej: Sucursal Centro" className={ic} /></div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Santo Domingo" className={ic} /></div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="809-000-0000" className={ic} /></div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Ubicación</label>
                            <Suspense fallback={<div className="h-72 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center"><Loader2 size={18} className="text-gray-400 animate-spin" /></div>}>
                                <MapPicker value={mapLoc} onChange={setMapLoc} height={300} />
                            </Suspense>
                            {mapLoc?.address && <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2"><MapPin size={13} className="text-blue-500 mt-0.5 shrink-0" /><p className="text-xs text-blue-700">{mapLoc.address}</p></div>}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_main} onChange={e => setForm(f => ({ ...f, is_main: e.target.checked }))} className="rounded border-gray-300 text-blue-600" /><span className="text-sm text-gray-700">Sucursal principal</span></label>
                        {msg && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />{msg}</p>}
                        {error && <p className="text-red-500 text-sm flex items-center gap-1.5"><XCircle size={13} />{error}</p>}
                        <button type="submit" className={btn}>Crear Sucursal</button>
                    </form>
                </div>
            </div>
            <div>
                <p className="text-gray-600 font-semibold text-sm mb-3">Sucursales registradas</p>
                {loading ? <Spinner /> : branches.length === 0 ? <Empty msg="Sin sucursales" /> : (
                    <div className="space-y-3">
                        {branches.map(b => (
                            <div key={b.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-4">
                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Building2 size={16} className="text-blue-600" /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap"><p className="text-gray-900 font-semibold text-sm">{b.name}</p>{b.is_main && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200">Principal</span>}</div>
                                        {b.address && <p className="text-gray-500 text-xs mt-0.5 truncate max-w-lg">{b.address}</p>}
                                        <div className="flex items-center gap-3 mt-0.5">{b.city && <span className="text-gray-400 text-xs flex items-center gap-1"><MapPin size={10} />{b.city}</span>}{b.phone && <span className="text-gray-400 text-xs flex items-center gap-1"><Phone size={10} />{b.phone}</span>}</div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {b.latitude && b.longitude && <button onClick={() => setExpandedMap(expandedMap === b.id ? null : b.id)} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium transition">{expandedMap === b.id ? <EyeOff size={13} /> : <Eye size={13} />}{expandedMap === b.id ? 'Ocultar' : 'Ver mapa'}</button>}
                                        <button onClick={() => handleDel(b.id)} className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs transition"><Trash2 size={13} />Desactivar</button>
                                    </div>
                                </div>
                                {expandedMap === b.id && b.latitude && b.longitude && (
                                    <div className="border-t border-gray-100">
                                        <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 size={16} className="text-gray-400 animate-spin" /></div>}>
                                            <MapPicker value={{ lat: b.latitude, lng: b.longitude, address: b.address ?? '' }} readOnly height={200} />
                                        </Suspense>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── SETTINGS ── */
function SettingsView({ instId }: { instId: string }) {
    const [rules, setRules] = useState<any>({ auto_confirm: true, buffer_minutes: 0, max_per_slot: 1, no_show_minutes: 30, advance_book_days: 30 });
    const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [msg, setMsg] = useState('');
    useEffect(() => { getBusinessRules(instId).then(r => setRules(r.data)).finally(() => setLoading(false)); }, [instId]);
    const handleSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); setMsg(''); try { const res = await updateBusinessRules(instId, rules); setRules(res.data); setMsg('ok'); } catch { setMsg('error'); } finally { setSaving(false); setTimeout(() => setMsg(''), 4000); } };
    if (loading) return <Spinner />;
    const fields = [{ key: 'buffer_minutes', label: 'Buffer entre citas', unit: 'min', desc: 'Tiempo de descanso entre citas.', min: 0, max: 120 }, { key: 'max_per_slot', label: 'Citas simultáneas máx.', unit: 'citas', desc: 'Cuántas citas al mismo tiempo.', min: 1, max: 50 }, { key: 'no_show_minutes', label: 'Espera para NO_SHOW', unit: 'min', desc: 'Minutos antes de marcar como no presentado.', min: 5, max: 120 }, { key: 'advance_book_days', label: 'Días de anticipación', unit: 'días', desc: 'Con cuántos días se puede agendar.', min: 1, max: 365 }];
    return (
        <div className="space-y-6 max-w-2xl">
            <Hdr title="Configuración Automática" sub="Define cómo el motor de citas gestiona la disponibilidad" />
            <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                <div className="flex items-start justify-between gap-4 p-6">
                    <div><p className="text-gray-800 font-semibold text-sm">Confirmación automática</p><p className="text-gray-500 text-xs mt-0.5">Las citas se confirman al instante sin intervención manual.</p></div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0"><input type="checkbox" checked={rules.auto_confirm} onChange={e => setRules((r: any) => ({ ...r, auto_confirm: e.target.checked }))} className="sr-only peer" /><div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" /></label>
                </div>
                {fields.map(({ key, label, unit, desc, min, max }) => (
                    <div key={key} className="p-6">
                        <p className="text-gray-800 font-semibold text-sm">{label}</p>
                        <p className="text-gray-500 text-xs mt-0.5 mb-3">{desc}</p>
                        <div className="flex items-center gap-3"><input type="number" min={min} max={max} value={rules[key]} onChange={e => setRules((r: any) => ({ ...r, [key]: Number(e.target.value) }))} className={`${ic} w-28`} /><span className="text-gray-500 text-sm">{unit}</span></div>
                    </div>
                ))}
                <div className="p-6 flex items-center gap-4">
                    <button type="submit" disabled={saving} className={`${btn} flex items-center gap-2`}>{saving ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : <>Guardar Configuración</>}</button>
                    {msg === 'ok' && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />Guardado correctamente.</p>}
                    {msg === 'error' && <p className="text-red-500 text-sm flex items-center gap-1.5"><XCircle size={13} />Error al guardar.</p>}
                </div>
            </form>
        </div>
    );
}
