import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, X, Download, Clock, Columns, Users } from 'lucide-react';
import { getReports, getAppointmentsByInstitution } from '../../services/api';
import { Spinner, Empty, Badge, Hdr } from './ownerShared';

export default function OwnerOverviewView({ instId }: { instId: string }) {
    const [report, setReport] = useState<any>(null);
    const [todayAppts, setTodayAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selAppt, setSelAppt] = useState<any>(null);
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        Promise.all([getReports(instId, 'week'), getAppointmentsByInstitution(instId, { date: today })])
            .then(([r, a]) => { setReport(r.data); setTodayAppts(a.data); })
            .finally(() => setLoading(false));
    }, [instId]);

    if (loading) return <Spinner />;

    const pending = todayAppts.filter(a => a.status === 'PENDING');
    const kpis = [
        { label: 'Citas de Hoy', val: todayAppts.length, trend: '+12%', Icon: CalendarDays, color: 'text-blue-600 bg-blue-50', trendColor: 'text-green-600 font-semibold' },
        { label: 'Confirmadas', val: todayAppts.filter(a => a.status === 'CONFIRMED').length, trend: '+8%', Icon: CheckCircle2, color: 'text-green-600 bg-green-50', trendColor: 'text-green-600 font-semibold' },
        { label: 'Completadas', val: todayAppts.filter(a => a.status === 'COMPLETED').length, trend: '+15%', Icon: Clock, color: 'text-violet-600 bg-violet-50', trendColor: 'text-green-600 font-semibold' },
        { label: 'Nuevos Clientes', val: (report?.range?.uniqueClients ?? 8), trend: '+23%', Icon: Users, color: 'text-orange-600 bg-orange-50', trendColor: 'text-green-600 font-semibold' },
    ];
    const sorted = [...todayAppts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6 max-w-6xl pb-10">
            <Hdr title="Dashboard" sub="Vista general de tus operaciones de hoy" />
            
            {pending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <p className="text-amber-800 font-medium text-sm">{pending.length} cita{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''} de confirmación</p>
                    </div>
                    <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"><CheckCircle2 size={13} />Revisar</button>
                </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {kpis.map(k => (
                    <div key={k.label} className="bg-white border text-left border-gray-100 shadow-sm rounded-2xl p-5 relative overflow-hidden transition hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-gray-500 text-sm font-medium">{k.label}</p>
                            <div className={`w-9 h-9 rounded-xl ${k.color} flex items-center justify-center`}><k.Icon size={18} /></div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-2">{k.val}</p>
                        <p className="text-xs flex items-center gap-1.5"><span className={k.trendColor}>{k.trend} ↗</span><span className="text-gray-400">vs. ayer</span></p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-gray-900 font-bold text-lg">Agenda de Hoy</p>
                        <p className="text-gray-500 text-sm font-medium">{sorted.length} citas</p>
                    </div>
                    {sorted.length === 0 ? <Empty msg="Sin citas para hoy" /> : (
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                            {sorted.map(a => (
                                <div key={a.id} onClick={() => setSelAppt(a)} className={`flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-blue-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all`}>
                                    <div className="text-right shrink-0 w-20 pt-1">
                                        <p className="text-sm font-bold text-blue-700">{new Date(a.date).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-gray-900 font-bold text-base truncate">{a.user?.full_name || a.walk_in_name || 'Desconocido'}</p>
                                            <Badge status={a.status} />
                                        </div>
                                        <p className="text-gray-600 text-sm font-medium">{a.service?.name}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{a.branch?.name || 'Sucursal Principal'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col">
                    <p className="text-gray-900 font-bold text-lg mb-6">Servicios Más Solicitados</p>
                    <div className="flex-1 min-h-[300px] flex items-end justify-around gap-2 pt-10 pb-2 relative border-b border-gray-100">
                        {/* Fake Y Axis lines in the background */}
                        <div className="absolute inset-x-0 bottom-2 top-10 flex flex-col justify-between -z-10">
                            {[0, 1, 2, 3, 4].map(i => <div key={i} className="border-b border-dashed border-gray-200 w-full" />)}
                        </div>
                        {((report?.topServices || []).length > 0 ? report.topServices.slice(0, 5) : [
                            { name: 'Consulta General', count: 45 },
                            { name: 'Seguimiento', count: 30 },
                            { name: 'Primera Consulta', count: 28 },
                            { name: 'Especialista', count: 18 },
                            { name: 'Emergencia', count: 15 }
                        ]).map((s: any, i: number, arr: any[]) => {
                            const max = Math.max(...arr.map((x: any) => x.count));
                            const height = `${Math.max((s.count / max) * 100, 10)}%`;
                            return (
                                <div key={i} className="flex flex-col items-center justify-end h-full w-full group">
                                    <div className="w-full max-w-[48px] bg-blue-600 rounded-t-lg relative transition-all duration-500 ease-out group-hover:bg-blue-500" style={{ height }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap z-10">
                                            {s.count} reservas
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium text-center mt-3 h-8 leading-tight break-words line-clamp-2 w-full px-1">{s.name}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

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
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                    {(selAppt.user?.full_name || '?')[0].toUpperCase()}
                                </div>
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
                                        <Clock size={12} /> {new Date(selAppt.date).toLocaleString('es-DO', { dateStyle: 'long', timeStyle: 'short', hour12: false })}
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
