import { useEffect, useState, Suspense, lazy } from 'react';
import Navbar from '../components/Navbar';
import {
    getInstitutions, getInstitution, getServicesByInstitution,
    createAppointment, getAppointments, getBranches,
} from '../services/api';
import { Phone, ChevronDown, ChevronUp, Building2 } from 'lucide-react';

// Lazy load map to avoid bundle bloat
const MapPicker = lazy(() => import('../components/MapPicker'));

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    NO_SHOW: 'bg-gray-100 text-gray-500 border-gray-200',
};

const FIELD_TYPE_INPUTS: Record<string, string> = {
    TEXT: 'text', NUMBER: 'number', DATE: 'date', EMAIL: 'email', PHONE: 'tel', SELECT: 'select',
};

type Tab = 'browse' | 'book' | 'appointments';

const inputClass = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

export default function ClientDashboard() {
    const [tab, setTab] = useState<Tab>('browse');
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [myAppointments, setMyAppointments] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
    const [bookMsg, setBookMsg] = useState('');
    const [bookError, setBookError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadInstitutions(); }, []);
    useEffect(() => { if (tab === 'appointments') loadMyAppointments(); }, [tab]);

    const loadInstitutions = async (q?: string) => {
        try { setInstitutions((await getInstitutions(q)).data); } catch { setInstitutions([]); }
    };
    const loadMyAppointments = async () => {
        try { setMyAppointments((await getAppointments()).data); } catch { setMyAppointments([]); }
    };

    const handleSelectInstitution = async (inst: any) => {
        setSelectedInstitution(null); setSelectedService(null); setFieldValues({});
        setBranches([]); setExpandedBranch(null);
        const [fullInst, svcRes, branchRes] = await Promise.all([
            getInstitution(inst.id),
            getServicesByInstitution(inst.id),
            getBranches(inst.id),
        ]);
        setSelectedInstitution(fullInst.data);
        setServices(svcRes.data);
        setBranches(branchRes.data);
        setTab('book');
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInstitution || !selectedService) return;
        setLoading(true); setBookError(''); setBookMsg('');
        try {
            await createAppointment({
                institution_id: selectedInstitution.id, service_id: selectedService.id,
                date: new Date(date).toISOString(), notes,
                field_responses: Object.entries(fieldValues)
                    .map(([field_id, value]) => ({ field_id, value })).filter(r => r.value.trim() !== ''),
            });
            setBookMsg('Cita agendada exitosamente.');
            setSelectedService(null); setDate(''); setNotes(''); setFieldValues({});
            loadMyAppointments();
        } catch (err: any) {
            const msg = err.response?.data?.message;
            setBookError(Array.isArray(msg) ? msg.join('. ') : msg || 'Error al agendar');
        } finally { setLoading(false); }
    };

    const dynamicFields = selectedInstitution?.institution_type?.fields || [];

    const tabs: [Tab, string][] = [['browse', 'Instituciones'], ['book', 'Agendar Cita'], ['appointments', 'Mis Citas']];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6 space-y-6">

                {/* Page title */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Portal de Citas</h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-gray-200">
                    {tabs.map(([key, label]) => (
                        <button key={key} id={`tab-${key}`} onClick={() => setTab(key)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* BROWSE */}
                {tab === 'browse' && (
                    <div className="space-y-4">
                        <input value={search} onChange={e => { setSearch(e.target.value); loadInstitutions(e.target.value); }}
                            placeholder="Buscar institución..." className={inputClass} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {institutions.map(inst => (
                                <button key={inst.id} onClick={() => handleSelectInstitution(inst)}
                                    className="bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-5 text-left transition-all group">
                                    <p className="text-gray-900 font-medium text-sm group-hover:text-blue-600 transition">{inst.name}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{inst.institution_type?.name}</p>
                                    {inst.description && <p className="text-gray-500 text-xs mt-2 line-clamp-2">{inst.description}</p>}
                                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                                        <span className="text-gray-400 text-xs">{inst.services?.length || 0} servicio(s)</span>
                                        {inst._count && <span className="text-gray-400 text-xs">{inst._count.appointments} cita(s)</span>}
                                    </div>
                                </button>
                            ))}
                            {institutions.length === 0 && (
                                <div className="col-span-2 bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400 text-sm">
                                    Sin resultados
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* BOOK */}
                {tab === 'book' && (
                    <div className="space-y-4">
                        {!selectedInstitution ? (
                            <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400 text-sm">
                                Selecciona una institución desde la pestaña Instituciones
                            </div>
                        ) : (
                            <>
                                {/* Institution info + Branch locations */}
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <p className="text-gray-900 font-semibold">{selectedInstitution.name}</p>
                                    <p className="text-gray-500 text-sm">{selectedInstitution.institution_type?.name}</p>

                                    {/* Branches / Locations */}
                                    {branches.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sucursales</p>
                                            <div className="space-y-3">
                                                {branches.map((b) => (
                                                    <div key={b.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedBranch(expandedBranch === b.id ? null : b.id)}
                                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                                                    <Building2 size={14} className="text-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-800 font-medium text-sm">{b.name}</p>
                                                                    {b.address && <p className="text-gray-400 text-xs truncate max-w-xs">{b.address}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                {b.is_main && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200">Principal</span>}
                                                                {b.latitude && b.longitude && (
                                                                    <span className="text-blue-500 text-xs flex items-center gap-1">
                                                                        {expandedBranch === b.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                                        {expandedBranch === b.id ? 'Ocultar mapa' : 'Ver mapa'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                        {expandedBranch === b.id && b.latitude && b.longitude && (
                                                            <div className="border-t border-gray-100">
                                                                <Suspense fallback={<div className="h-48 flex items-center justify-center text-gray-400 text-sm">Cargando mapa...</div>}>
                                                                    <MapPicker
                                                                        value={{ lat: b.latitude, lng: b.longitude, address: b.address ?? '' }}
                                                                        readOnly
                                                                        height={200}
                                                                    />
                                                                </Suspense>
                                                                {b.phone && (
                                                                    <p className="px-4 py-2 text-xs text-gray-400 flex items-center gap-1.5">
                                                                        <Phone size={11} /> {b.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Services */}
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <p className="text-gray-700 font-medium text-sm mb-3">Selecciona un servicio</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {services.map(svc => (
                                            <button key={svc.id} type="button" onClick={() => setSelectedService(svc)}
                                                className={`rounded-lg p-3.5 text-left border transition-all ${selectedService?.id === svc.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <p className={`font-medium text-sm ${selectedService?.id === svc.id ? 'text-blue-700' : 'text-gray-900'}`}>{svc.name}</p>
                                                <div className="flex gap-3 mt-1">
                                                    <span className="text-gray-500 text-xs">{svc.duration} min</span>
                                                    {svc.price && <span className="text-gray-500 text-xs">RD${Number(svc.price).toFixed(2)}</span>}
                                                </div>
                                            </button>
                                        ))}
                                        {services.length === 0 && <p className="text-gray-400 text-sm">Sin servicios disponibles</p>}
                                    </div>
                                </div>

                                {selectedService && (
                                    <form onSubmit={handleBook} className="space-y-4">
                                        {/* Date */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                                            <label className="block text-gray-700 font-medium text-sm mb-2">Fecha y hora</label>
                                            <input id="appointment-date" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className={inputClass} />
                                        </div>

                                        {/* Dynamic fields */}
                                        {dynamicFields.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <p className="text-gray-700 font-medium text-sm mb-4">Información requerida</p>
                                                <div className="space-y-4">
                                                    {dynamicFields.map((field: any) => (
                                                        <div key={field.id}>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                                {field.label}
                                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            {field.field_type === 'SELECT' ? (
                                                                <select value={fieldValues[field.id] || ''} onChange={e => setFieldValues(v => ({ ...v, [field.id]: e.target.value }))} required={field.required} className={inputClass}>
                                                                    <option value="">Selecciona una opción</option>
                                                                    {JSON.parse(field.options || '[]').map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                            ) : (
                                                                <input type={FIELD_TYPE_INPUTS[field.field_type] || 'text'}
                                                                    value={fieldValues[field.id] || ''} onChange={e => setFieldValues(v => ({ ...v, [field.id]: e.target.value }))}
                                                                    required={field.required} placeholder={field.placeholder || ''} className={inputClass} />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                                            <label className="block text-gray-700 font-medium text-sm mb-2">Notas adicionales <span className="text-gray-400 font-normal">(opcional)</span></label>
                                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Indique cualquier información adicional..." className={inputClass + ' resize-none'} />
                                        </div>

                                        {bookMsg && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">{bookMsg}</div>}
                                        {bookError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{bookError}</div>}

                                        <button id="book-submit" type="submit" disabled={loading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition">
                                            {loading ? 'Agendando...' : `Confirmar — ${selectedService.name}`}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* MY APPOINTMENTS */}
                {tab === 'appointments' && (
                    <div className="space-y-3">
                        {myAppointments.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400 text-sm">No tienes citas aún</div>
                        ) : (
                            myAppointments.map(app => (
                                <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-gray-900 font-medium text-sm">{app.institution?.name}</p>
                                            <p className="text-gray-500 text-sm">{app.service?.name} · {app.service?.duration} min</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{new Date(app.date).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                                    </div>
                                    {app.responses?.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-1.5">
                                            {app.responses.map((r: any) => (
                                                <div key={r.id} className="text-xs">
                                                    <span className="text-gray-400">{r.field?.label}: </span>
                                                    <span className="text-gray-700">{r.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
