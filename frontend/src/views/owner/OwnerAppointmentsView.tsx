import { useState, useEffect, useCallback } from 'react';
import { Columns, List, Search, Clock, Eye, X, Download } from 'lucide-react';
import { getAppointmentsByInstitution, updateAppointment } from '../../services/api';
import { STO, SL, KANBAN_COLS, SC, Spinner, Empty, Hdr, Avatar, Badge } from './ownerShared';

export default function OwnerAppointmentsView({ instId }: { instId: string }) {
    const [appts, setAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selAppt, setSelAppt] = useState<any>(null);

    const load = useCallback(() => {
        setLoading(true);
        getAppointmentsByInstitution(instId, { status: statusFilter || undefined })
            .then(r => setAppts(r.data))
            .finally(() => setLoading(false));
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
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Todos los estados</option>
                    {STO.map(s => <option key={s} value={s}>{SL[s]}</option>)}
                </select>
            </div>

            {loading ? <Spinner /> : viewMode === 'kanban' ? (
                <div className="flex gap-4 overflow-x-auto pb-4 items-start">
                    {KANBAN_COLS.map(([status, label]) => {
                        const col = filtered.filter(a => a.status === status);
                        return (
                            <div key={status} className="shrink-0 w-72">
                                <div className={`flex items-center justify-between mb-3 px-1`}>
                                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${SC[status]}`}>{col.length}</span>
                                </div>
                                <div className="space-y-3 min-h-[6rem]">
                                    {col.map(a => (
                                        <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-start gap-2">
                                                    <Avatar name={a.user?.full_name || '?'} size={8} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-900 font-semibold text-sm truncate">{a.user?.full_name}</p>
                                                        <p className="text-gray-500 text-xs truncate" title={a.service?.name}>{a.service?.name}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelAppt(a)} className="text-gray-400 hover:text-blue-600 transition p-1 shrink-0"><Eye size={16} /></button>
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
                                <button onClick={() => setSelAppt(a)} className="text-gray-400 hover:text-blue-600 transition p-2 border border-gray-200 rounded-lg hover:bg-blue-50">
                                    <Eye size={16} />
                                </button>
                                <Badge status={a.status} />
                                <select value={a.status} onChange={e => handleStatus(a.id, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white">
                                    {STO.map(s => <option key={s} value={s}>{SL[s]}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Modal de Detalles de Cita */}
            {selAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Detalles de la Cita</h3>
                                <p className="text-xs text-gray-500">Información y campos dinámicos</p>
                            </div>
                            <button onClick={() => setSelAppt(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Header Info */}
                            <div className="flex gap-4 items-center">
                                <Avatar name={selAppt.user?.full_name || '?'} size={12} />
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{selAppt.user?.full_name}</p>
                                    <p className="text-sm text-gray-500">{selAppt.user?.email} {selAppt.user?.phone ? `· ${selAppt.user.phone}` : ''}</p>
                                </div>
                            </div>

                            {/* Service Info */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Servicio</span>
                                    <span className="text-sm font-bold text-gray-900">{selAppt.service?.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Fecha & Hora</span>
                                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Clock size={12} /> {new Date(selAppt.date).toLocaleString('es-DO', { dateStyle: 'long', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-1">
                                    <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Estado actual</span>
                                    <Badge status={selAppt.status} />
                                </div>
                            </div>

                            {/* Dynamically Answered Fields */}
                            <div>
                                <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                                    <Columns size={16} className="text-blue-500" /> Respuestas del Cliente
                                </h4>
                                {(!selAppt.responses || selAppt.responses.length === 0) ? (
                                    <p className="text-xs text-gray-400">El cliente no respondió preguntas adicionales.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {selAppt.responses.map((r: any) => (
                                            <div key={r.id}>
                                                <p className="text-xs font-semibold text-gray-500 mb-1">{r.field?.label}</p>
                                                {r.field?.field_type === 'FILE' ? (
                                                    <div className="mt-1">
                                                        <a href={r.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 text-sm text-blue-600 font-medium rounded-xl hover:bg-gray-100 transition">
                                                            <Download size={14} /> Ver Documento / Imagen
                                                        </a>
                                                        <img src={r.value} alt="Attachment preview" className="mt-2 max-w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                                                        {r.value || <span className="text-gray-300 italic">Vacio</span>}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {selAppt.notes && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-2">Notas / Comentarios</h4>
                                    <p className="text-sm text-gray-600 bg-yellow-50 px-4 py-3 rounded-xl border border-yellow-100">
                                        {selAppt.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setSelAppt(null)} className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition">
                                Cerrar ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
