import { useState, useEffect, useCallback } from 'react';
import { Columns, List, Search, Clock, X, Download, MapPin, CalendarDays, MoreVertical } from 'lucide-react';
import { getAppointmentsByInstitution, updateAppointment, cancelAppointment } from '../../services/api';
import { STO, SL, Spinner, Empty, Hdr, Avatar, Badge, btn } from './ownerShared';
import OwnerNewAppointmentModal from './OwnerNewAppointmentModal';

export default function OwnerAppointmentsView({ instId }: { instId: string }) {
    const [appts, setAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selAppt, setSelAppt] = useState<any>(null);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        getAppointmentsByInstitution(instId, { status: statusFilter || undefined })
            .then(r => setAppts(r.data))
            .finally(() => setLoading(false));
    }, [instId, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const handleStatus = async (id: string, status: string) => {
        try {
            if (status === 'CANCELLED') await cancelAppointment(id);
            else await updateAppointment(id, { status });
            setAppts(p => p.map(a => a.id === id ? { ...a, status } : a));
            if (selAppt?.id === id) setSelAppt((p: any) => ({ ...p, status }));
        } catch (e) {
            alert('Error al actualizar el estado de la cita');
        }
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('apptId');
        if (id) handleStatus(id, status);
    };

    const filtered = appts.filter(a => !search || a.user?.full_name?.toLowerCase().includes(search.toLowerCase()) || a.service?.name?.toLowerCase().includes(search.toLowerCase()) || a.walk_in_name?.toLowerCase().includes(search.toLowerCase()));

    const LOCAL_KANBAN_COLS = [
        ['PENDING', 'Pendiente', 'border-t-4 border-t-amber-400'],
        ['CONFIRMED', 'Confirmada', 'border-t-4 border-t-blue-500'],
        ['COMPLETED', 'Completada', 'border-t-4 border-t-green-500'],
        ['CANCELLED', 'Cancelada', 'border-t-4 border-t-red-500'],
    ] as const;

    return (
        <div className="space-y-4 max-w-full">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Hdr title="Citas" sub="Gestiona todas las citas de tu institución" />
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsNewModalOpen(true)} className={`${btn} flex items-center gap-1.5`}>
                        + Nueva Cita
                    </button>
                    <div className="h-6 w-[1px] bg-gray-200"></div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${viewMode === 'kanban' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><Columns size={13} />Kanban</button>
                        <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><List size={13} />Lista</button>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Todos los estados</option>
                    {STO.map(s => <option key={s} value={s}>{SL[s as keyof typeof SL]}</option>)}
                </select>
            </div>

            {loading ? <Spinner /> : viewMode === 'kanban' ? (
                <div className="flex gap-4 overflow-x-auto pb-4 items-start pt-2">
                    {LOCAL_KANBAN_COLS.map(([status, label, borderClass]) => {
                        const col = filtered.filter(a => a.status === status);
                        return (
                            <div 
                                key={status} 
                                onDragOver={e => e.preventDefault()} 
                                onDrop={e => handleDrop(e, status)}
                                className={`shrink-0 w-72 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${borderClass}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-gray-900">{label}</span>
                                    <span className="text-xs font-bold text-gray-500">{col.length}</span>
                                </div>
                                <div className="space-y-3 min-h-[6rem]">
                                    {col.map(a => (
                                        <div 
                                            key={a.id} 
                                            draggable 
                                            onDragStart={e => e.dataTransfer.setData('apptId', a.id)}
                                            onClick={() => setSelAppt(a)} 
                                            className="bg-white border text-left border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing"
                                        >
                                            <p className="text-gray-900 font-bold text-sm truncate">{a.user?.full_name || a.walk_in_name || 'Desconocido'}</p>
                                            <p className="text-gray-500 text-xs truncate mt-0.5">{a.service?.name}</p>
                                            
                                            <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-1.5"><CalendarDays size={12} className="text-gray-400"/>{new Date(a.date).toLocaleDateString('es-DO', { month: '2-digit', day: '2-digit' })} · {new Date(a.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2 truncate"><MapPin size={12} className="text-gray-400"/>{a.branch?.name || 'Sucursal Centro'}</div>
                                        </div>
                                    ))}
                                    {col.length === 0 && <div className="border-2 border-dashed border-gray-100 rounded-xl h-24 flex items-center justify-center text-gray-400 text-xs pointer-events-none">Arrastra citas aquí</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                filtered.length === 0 ? <Empty msg="Sin citas" /> : (
                    <div className="bg-white border text-left border-gray-100 shadow-sm rounded-2xl overflow-hidden mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Fecha & Hora</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Cliente</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Servicio</th>
                                    <th className="py-4 px-6 font-semibold whitespace-nowrap">Sucursal</th>
                                    <th className="py-4 px-6 font-semibold text-center whitespace-nowrap">Estado</th>
                                    <th className="py-4 px-6 font-semibold text-center whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <p className="text-gray-900 font-semibold flex items-center gap-2"><CalendarDays size={14} className="text-gray-400" /> {new Date(a.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p className="text-gray-500 text-xs pl-6">{new Date(a.date).toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-gray-900 font-bold truncate">{a.user?.full_name || a.walk_in_name || 'Desconocido'}</p>
                                            {a.user?.email && <p className="text-gray-500 text-xs truncate">{a.user?.email}</p>}
                                        </td>
                                        <td className="py-4 px-6 text-gray-700 font-medium truncate">{a.service?.name}</td>
                                        <td className="py-4 px-6 text-gray-500 text-sm truncate">
                                            <div className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400"/> {a.branch?.name || 'Sucursal Centro'}</div>
                                        </td>
                                        <td className="py-4 px-6 text-center"><Badge status={a.status} /></td>
                                        <td className="py-4 px-6 flex items-center justify-center gap-2 mt-2">
                                            <select 
                                                value={a.status} 
                                                onChange={e => handleStatus(a.id, e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                                            >
                                                {STO.map(s => <option key={s} value={s}>{SL[s as keyof typeof SL]}</option>)}
                                            </select>
                                            <button onClick={() => setSelAppt(a)} className="text-gray-400 hover:text-blue-600 transition p-1" title="Ver Detalles"><MoreVertical size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-wrap-reverse justify-between items-center gap-4">
                            <button onClick={() => setSelAppt(null)} className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition shadow-sm">
                                Cerrar ventana
                            </button>
                            <div className="flex gap-2 flex-wrap">
                                {selAppt.status !== 'CONFIRMED' && selAppt.status !== 'CANCELLED' && selAppt.status !== 'COMPLETED' && (
                                    <button onClick={() => handleStatus(selAppt.id, 'CONFIRMED')} className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-sm">Confirmar</button>
                                )}
                                {selAppt.status !== 'COMPLETED' && selAppt.status !== 'CANCELLED' && (
                                    <button onClick={() => handleStatus(selAppt.id, 'COMPLETED')} className="px-4 py-2.5 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition shadow-sm">Completar</button>
                                )}
                                {selAppt.status !== 'CANCELLED' && (
                                    <button onClick={() => handleStatus(selAppt.id, 'CANCELLED')} className="px-4 py-2.5 bg-red-100 text-red-700 text-sm font-bold rounded-xl hover:bg-red-200 transition">Cancelar</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isNewModalOpen && (
                <OwnerNewAppointmentModal
                    instId={instId}
                    onClose={() => setIsNewModalOpen(false)}
                    onRefresh={load}
                />
            )}
        </div>
    );
}
