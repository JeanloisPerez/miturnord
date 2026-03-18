import { useState } from 'react';
import { Calendar, X, Loader2, MapPin } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS, getTypeGradient, fmtDT } from './clientShared';
import { cancelAppointment } from '../../services/api';

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({ app, onCancel }: { app: any; onCancel?: () => void }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${getTypeGradient(app.institution?.institution_type?.name)}`}>
                        <span className="text-white text-sm font-bold">{(app.institution?.name || '?')[0]}</span>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">{app.institution?.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{app.service?.name}{app.service?.duration && ` · ${app.service.duration} min`}</p>
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><Calendar size={10} />{fmtDT(app.date)}</p>
                        {app.branch && <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10} />{app.branch.name}</p>}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status] || app.status}
                    </span>
                    {onCancel && (
                        <button onClick={onCancel} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                            <X size={10} />Cancelar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientApptsView({
    myAppts, apptLoading, onBookMore, loadMyAppts
}: {
    myAppts: any[];
    apptLoading: boolean;
    onBookMore: () => void;
    loadMyAppts: () => Promise<void>;
}) {
    const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const upcoming = myAppts.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status));
    const past = myAppts.filter(a => ['COMPLETED', 'NO_SHOW', 'RESCHEDULED'].includes(a.status));
    const cancelled = myAppts.filter(a => a.status === 'CANCELLED');

    const handleCancel = async (id: string) => {
        setCancellingId(id);
        try {
            await cancelAppointment(id);
            await loadMyAppts();
        }
        catch { }
        finally {
            setCancellingId(null);
            setCancelConfirmId(null);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 pb-20 space-y-6">
            <h1 className="text-2xl font-black text-gray-900">Mis Turnos</h1>

            {/* Cancel dialog */}
            {cancelConfirmId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-black text-gray-900 mb-1">¿Cancelar esta cita?</h3>
                        <p className="text-gray-500 text-sm mb-5">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setCancelConfirmId(null)}
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold text-sm rounded-2xl hover:bg-gray-50 transition">
                                Volver
                            </button>
                            <button onClick={() => handleCancel(cancelConfirmId)} disabled={!!cancellingId}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-2xl transition flex items-center justify-center gap-2">
                                {cancellingId ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                Cancelar cita
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {apptLoading ? (
                <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
            ) : myAppts.length === 0 ? (
                <div className="text-center py-28">
                    <Calendar size={44} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 mb-5">Aún no tienes citas agendadas</p>
                    <button onClick={onBookMore}
                        className="px-6 py-3 bg-black text-white font-bold text-sm rounded-full hover:bg-gray-800 transition">
                        Reservar ahora
                    </button>
                </div>
            ) : (
                <>
                    {upcoming.length > 0 && (
                        <section>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Próximas</p>
                            <div className="space-y-3">
                                {upcoming.map(a => <AppointmentCard key={a.id} app={a} onCancel={() => setCancelConfirmId(a.id)} />)}
                            </div>
                        </section>
                    )}
                    {past.length > 0 && (
                        <section>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Historial</p>
                            <div className="space-y-3">{past.map(a => <AppointmentCard key={a.id} app={a} />)}</div>
                        </section>
                    )}
                    {cancelled.length > 0 && (
                        <section>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Canceladas</p>
                            <div className="space-y-3">{cancelled.map(a => <AppointmentCard key={a.id} app={a} />)}</div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
