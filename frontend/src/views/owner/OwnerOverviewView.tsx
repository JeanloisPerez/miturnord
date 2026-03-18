import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, Zap, Eye, X, Download, Clock, Columns } from 'lucide-react';
import { getReports, getAppointmentsByInstitution } from '../../services/api';
import { Spinner, Empty, Badge, SC } from './ownerShared';

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
                                    <button onClick={() => setSelAppt(a)} className="text-gray-400 hover:text-blue-600 transition p-1.5 border border-gray-200 rounded-lg hover:bg-blue-50 shrink-0">
                                        <Eye size={16} />
                                    </button>
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
