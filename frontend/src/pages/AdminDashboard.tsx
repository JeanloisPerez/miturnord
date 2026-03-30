import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getInstitutions, getInstitutionTypes, getAppointments, deleteAppointment } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    NO_SHOW: 'bg-gray-100 text-gray-500 border-gray-200',
};

type Tab = 'overview' | 'institutions' | 'appointments' | 'types';

export default function AdminDashboard() {
    const [tab, setTab] = useState<Tab>('overview');
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getInstitutions(), getAppointments(), getInstitutionTypes()])
            .then(([iRes, aRes, tRes]) => { setInstitutions(iRes.data); setAppointments(aRes.data); setTypes(tRes.data); })
            .finally(() => setLoading(false));
    }, []);

    const handleDeleteAppointment = async (id: string) => {
        if (!confirm('¿Eliminar esta cita?')) return;
        await deleteAppointment(id);
        setAppointments(prev => prev.filter(a => a.id !== id));
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-sm">Cargando...</div>;

    const tabList: [Tab, string][] = [['overview', 'Resumen'], ['institutions', 'Instituciones'], ['appointments', 'Citas'], ['types', 'Tipos']];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto p-6 space-y-6">

                {/* Header */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Panel de Administración</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Vista global del sistema MiTurnoRD</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[['Instituciones', institutions.length], ['Citas totales', appointments.length], ['Tipos', types.length], ['Pendientes', appointments.filter(a => a.status === 'PENDING').length]].map(([label, value]) => (
                        <div key={String(label)} className="bg-white border border-gray-200 rounded-xl p-5">
                            <p className="text-2xl font-semibold text-gray-900">{value}</p>
                            <p className="text-gray-500 text-sm mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-gray-200">
                    {tabList.map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW */}
                {tab === 'overview' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <p className="text-gray-800 font-medium text-sm mb-4">Por Tipo de Institución</p>
                            <div className="space-y-2">
                                {types.map(t => {
                                    const count = institutions.filter(i => i.institution_type?.name === t.name).length;
                                    return (
                                        <div key={t.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">{t.name}</span>
                                            <span className="text-gray-400">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <p className="text-gray-800 font-medium text-sm mb-4">Citas recientes</p>
                            <div className="space-y-3">
                                {appointments.slice(0, 5).map(app => (
                                    <div key={app.id} className="flex items-start gap-2">
                                        <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                                        <div className="min-w-0">
                                            <p className="text-gray-800 text-sm truncate">{app.user?.full_name}</p>
                                            <p className="text-gray-400 text-xs">{app.institution?.name} · {app.service?.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* INSTITUTIONS */}
                {tab === 'institutions' && (
                    <div className="space-y-3">
                        {institutions.map(inst => (
                            <div key={inst.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-gray-900 font-medium text-sm">{inst.name}</p>
                                    <p className="text-gray-500 text-xs">{inst.institution_type?.name}</p>
                                    {inst.address && <p className="text-gray-400 text-xs mt-0.5">{inst.address}</p>}
                                    <p className="text-gray-400 text-xs mt-1">{inst.services?.length || 0} servicios</p>
                                </div>
                                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${inst.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {inst.status}
                                </span>
                            </div>
                        ))}
                        {institutions.length === 0 && <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400 text-sm">Sin instituciones</div>}
                    </div>
                )}

                {/* APPOINTMENTS */}
                {tab === 'appointments' && (
                    <div className="space-y-3">
                        {appointments.map(app => (
                            <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div>
                                        <p className="text-gray-900 font-medium text-sm">{app.user?.full_name}</p>
                                        <p className="text-gray-500 text-sm">{app.institution?.name} · {app.service?.name}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{new Date(app.date).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short', hour12: false })}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                                        <button onClick={() => handleDeleteAppointment(app.id)} className="text-red-500 hover:text-red-700 text-xs font-medium transition">Eliminar</button>
                                    </div>
                                </div>
                                {app.responses?.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1.5">
                                        {app.responses.map((r: any) => (
                                            <div key={r.id} className="text-xs">
                                                <span className="text-gray-400">{r.field?.label}: </span>
                                                <span className="text-gray-700">{r.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {appointments.length === 0 && <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400 text-sm">Sin citas</div>}
                    </div>
                )}

                {/* TYPES */}
                {tab === 'types' && (
                    <div className="space-y-4">
                        {types.map(t => (
                            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-gray-900 font-medium text-sm">{t.name}</p>
                                        <p className="text-gray-400 text-xs">{t._count?.institutions ?? 0} instituciones · {t.fields?.length ?? 0} campos</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {t.fields?.map((f: any) => (
                                        <span key={f.id} className={`px-2.5 py-1 rounded-full text-xs border ${f.required ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                            {f.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
