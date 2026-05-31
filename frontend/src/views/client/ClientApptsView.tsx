import { useState, useEffect } from 'react';
import { Calendar, X, Loader2, MapPin, ChevronRight, Building2, Sparkles, FileText, Star, Clock, Search } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS, getTypeGradient, fmtDT, generateTurnCode, todayStr } from './clientShared';
import { cancelAppointment, rescheduleAppointment, getAvailableSlots, createReview } from '../../services/api';

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({ app, onClick, onCancel }: { app: any; onClick: () => void; onCancel?: () => void }) {
    const isUpcoming = ['PENDING', 'CONFIRMED'].includes(app.status);
    
    return (
        <button onClick={onClick} className="w-full text-left focus:outline-none group relative bg-white border border-gray-100 rounded-[24px] p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${getTypeGradient(app.institution?.institution_type?.name)} shadow-inner relative overflow-hidden`}>
                        {app.institution?.logo_url ? (
                            <img src={app.institution.logo_url} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-xl font-black relative z-10">{(app.institution?.name || '?')[0]}</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[app.status]}`}>
                                {STATUS_LABELS[app.status] || app.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight mt-1">{app.institution?.name}</h3>
                        <p className="text-gray-500 text-sm mt-0.5 font-medium">{app.service?.name}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5 text-xs text-black font-semibold bg-gray-50 px-2 py-1 rounded-lg">
                                <Calendar size={12} className="text-gray-400" />
                                {fmtDT(app.date)}
                            </div>
                            {app.branch && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <MapPin size={12} />
                                    <span className="truncate max-w-[120px] sm:max-w-[200px]">{app.branch.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full absolute right-5 top-5 bottom-5">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                        <ChevronRight size={16} />
                    </div>
                    
                    {onCancel && isUpcoming && (
                        <div onClick={(e) => { e.stopPropagation(); onCancel(); }} 
                            className="text-[11px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 mt-auto">
                            <X size={12} /> Cancelar
                        </div>
                    )}
                </div>
            </div>
        </button>
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
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
    
    // Status Modals
    const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
    const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
    
    // Reviews local state
    const [apptRating, setApptRating] = useState<number>(0);
    const [apptHoverRating, setApptHoverRating] = useState<number>(0);
    const [apptComment, setApptComment] = useState<string>('');
    const [submittingApptReview, setSubmittingApptReview] = useState<boolean>(false);
    const [apptReviewError, setApptReviewError] = useState<string>('');

    // Reset review form when appointment changes
    useEffect(() => {
        setApptRating(0);
        setApptHoverRating(0);
        setApptComment('');
        setApptReviewError('');
    }, [selectedAppt]);

    const handleApptReviewSubmit = async () => {
        if (!selectedAppt || apptRating === 0) return;
        setSubmittingApptReview(true);
        setApptReviewError('');
        try {
            const res = await createReview(selectedAppt.id, apptRating, apptComment);
            await loadMyAppts();
            // In-place update to reflect immediately
            setSelectedAppt((prev: any) => ({ ...prev, review: res.data }));
        } catch (err: any) {
            setApptReviewError(err.response?.data?.message || 'Error al enviar valoración.');
        } finally {
            setSubmittingApptReview(false);
        }
    };
    
    // Action Loaders
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    
    // Reschedule State
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [reschDate, setReschDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [reschSlot, setReschSlot] = useState('');
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [submittingResch, setSubmittingResch] = useState(false);

    const upcoming = myAppts.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status));
    const past = myAppts.filter(a => ['COMPLETED', 'NO_SHOW', 'RESCHEDULED'].includes(a.status));
    const cancelled = myAppts.filter(a => a.status === 'CANCELLED');

    const handleCancel = async (id: string) => {
        setCancellingId(id);
        try {
            await cancelAppointment(id);
            await loadMyAppts();
            setSelectedAppt(null);
        }
        catch { }
        finally {
            setCancellingId(null);
            setCancelConfirmId(null);
        }
    };

    const handleDateChange = async (date: string) => {
        setReschDate(date);
        setReschSlot('');
        setSlots([]);
        if (!date || !selectedAppt) return;
        
        setSlotsLoading(true);
        try {
            const r = await getAvailableSlots({
                institutionId: selectedAppt.institution_id,
                serviceId: selectedAppt.service_id,
                date,
                branchId: selectedAppt.branch_id || undefined
            });
            setSlots(r.data?.slots || r.data || []);
        } catch {
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleRescheduleSubmit = async () => {
        if (!selectedAppt || !reschDate || !reschSlot) return;
        setSubmittingResch(true);
        try {
            await rescheduleAppointment(selectedAppt.id, {
                date: `${reschDate}T${reschSlot}:00`,
            });
            await loadMyAppts();
            setSelectedAppt(null); // Close modal 
            setIsRescheduling(false);
        } catch { } // Error handling can be added here
        finally {
            setSubmittingResch(false);
        }
    };

    const displayList = filter === 'upcoming' ? upcoming : filter === 'past' ? past : cancelled;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Turnos</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona y revisa tu historial de reservaciones</p>
                </div>
                <button onClick={onBookMore} className="bg-black hover:bg-gray-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-md shadow-black/10 shrink-0">
                    + Nuevo turno
                </button>
            </div>

            {/* Cancel dialog - Modern Glassmorphism */}
            {cancelConfirmId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                            <X size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">¿Cancelar turno?</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            El lugar quedará disponible para otra persona. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setCancelConfirmId(null)}
                                className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 font-bold text-sm rounded-[16px] hover:bg-gray-50 transition-colors">
                                Volver
                            </button>
                            <button onClick={() => handleCancel(cancelConfirmId)} disabled={!!cancellingId}
                                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-[16px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30">
                                {cancellingId ? <Loader2 size={16} className="animate-spin" /> : "Sí, cancelar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail / Reschedule Modal */}
            {selectedAppt && !cancelConfirmId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200"
                     onClick={(e) => { if (e.target === e.currentTarget) { setSelectedAppt(null); setIsRescheduling(false); } }}>
                    
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 relative">
                        
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="font-black text-lg text-gray-900 tracking-tight">
                                {isRescheduling ? 'Cambiar Horario' : 'Detalles de tu cita'}
                            </h3>
                            <button onClick={() => { setSelectedAppt(null); setIsRescheduling(false); }} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                                <X size={16} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            
                            {!isRescheduling ? (
                                <>
                                    {/* Main Box - turn code */}
                                    {['PENDING', 'CONFIRMED'].includes(selectedAppt.status) && (
                                        <div className="bg-gray-900 border border-gray-800 rounded-[28px] p-6 text-center shadow-xl relative overflow-hidden group">
                                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
                                            <p className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em] mb-2 relative z-10">TU CÓDIGO</p>
                                            <p className="text-5xl font-black text-white tracking-widest relative z-10 group-hover:scale-110 transition-transform duration-500">{generateTurnCode(selectedAppt.id)}</p>
                                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-center gap-4 relative z-10">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[selectedAppt.status]}`}>
                                                    {STATUS_LABELS[selectedAppt.status]}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Info Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-[14px] bg-white text-gray-400 flex items-center justify-center shrink-0 border border-gray-200"><Building2 size={16}/></div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-gray-400">Institución</p>
                                                <p className="font-bold text-sm text-gray-900">{selectedAppt.institution?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-[14px] bg-white text-gray-400 flex items-center justify-center shrink-0 border border-gray-200"><Sparkles size={16}/></div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-gray-400">Servicio</p>
                                                <p className="font-bold text-sm text-gray-900">{selectedAppt.service?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-[14px] bg-white text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm"><Calendar size={16}/></div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-gray-400">Agendada para</p>
                                                <p className="font-bold text-sm text-gray-900">{fmtDT(selectedAppt.date)}</p>
                                            </div>
                                        </div>
                                        {selectedAppt.branch && (
                                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <div className="w-10 h-10 rounded-[14px] bg-white text-gray-400 flex items-center justify-center shrink-0 border border-gray-200"><MapPin size={16}/></div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-gray-400">Sucursal</p>
                                                    <p className="font-bold text-sm text-gray-900">{selectedAppt.branch.name}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedAppt.notes && (
                                            <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <div className="w-10 h-10 rounded-[14px] bg-white text-gray-400 flex items-center justify-center shrink-0 border border-gray-200"><FileText size={16}/></div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-gray-400">Notas Adicionales</p>
                                                    <p className="font-medium text-xs text-gray-600 mt-0.5">{selectedAppt.notes}</p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Bloque de Valoración para cita completada */}
                                        {selectedAppt.status === 'COMPLETED' && (
                                            <div className="border-t border-gray-100 pt-5 space-y-4">
                                                {selectedAppt.review ? (
                                                    // Ya valorado (solo lectura)
                                                    <div className="bg-amber-50/50 border border-amber-100 rounded-[20px] p-5 space-y-3">
                                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Star size={12} className="fill-amber-500 text-amber-500" /> Tu Valoración
                                                        </p>
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <Star key={star} size={18} className={`
                                                                    ${star <= selectedAppt.review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-transparent'}
                                                                `} strokeWidth={2} />
                                                            ))}
                                                        </div>
                                                        {selectedAppt.review.comment && (
                                                            <p className="text-gray-700 text-xs italic mt-2 bg-white/80 p-3 rounded-xl border border-amber-50 leading-relaxed">
                                                                "{selectedAppt.review.comment}"
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Aún no valorado (formulario interactivo)
                                                    <div className="bg-gray-50 border border-gray-100 rounded-[20px] p-5 space-y-4">
                                                        <h4 className="font-bold text-gray-900 text-sm">¿Cómo calificarías este servicio?</h4>
                                                        
                                                        {/* Stars selector */}
                                                        <div className="flex gap-1.5">
                                                            {[1, 2, 3, 4, 5].map((star) => {
                                                                const active = (apptHoverRating || apptRating) >= star;
                                                                return (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setApptRating(star)}
                                                                        onMouseEnter={() => setApptHoverRating(star)}
                                                                        onMouseLeave={() => setApptHoverRating(0)}
                                                                        className="focus:outline-none transition-transform active:scale-90"
                                                                    >
                                                                        <Star
                                                                            size={24}
                                                                            className={`transition-colors duration-150 ${
                                                                                active 
                                                                                    ? 'fill-amber-400 text-amber-400' 
                                                                                    : 'text-gray-300 fill-transparent hover:text-amber-300'
                                                                            }`}
                                                                            strokeWidth={1.5}
                                                                        />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Optional comment text box */}
                                                        <div className="space-y-1">
                                                            <textarea
                                                                value={apptComment}
                                                                onChange={(e) => setApptComment(e.target.value)}
                                                                rows={2}
                                                                placeholder="Deja un comentario opcional sobre tu experiencia..."
                                                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                                                            />
                                                        </div>

                                                        {apptReviewError && (
                                                            <p className="text-[11px] font-bold text-red-500">{apptReviewError}</p>
                                                        )}

                                                        <button
                                                            onClick={handleApptReviewSubmit}
                                                            disabled={apptRating === 0 || submittingApptReview}
                                                            className="w-full py-2.5 bg-black hover:bg-gray-800 disabled:opacity-30 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                        >
                                                            {submittingApptReview ? 'Enviando...' : 'Enviar valoración'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {['PENDING', 'CONFIRMED'].includes(selectedAppt.status) && (
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => { setReschDate(''); setReschSlot(''); setIsRescheduling(true); }}
                                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm rounded-[20px] transition-colors">
                                                Reagendar
                                            </button>
                                            <button onClick={() => setCancelConfirmId(selectedAppt.id)}
                                                className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-[20px] transition-colors">
                                                Cancelar Cita
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* RESCHEDULING ENGINE UI */
                                <div className="space-y-5 animate-in slide-in-from-right-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-[20px] p-4 flex gap-3 text-blue-700">
                                        <Clock size={20} className="shrink-0" />
                                        <p className="text-xs font-semibold">Selecciona una nueva fecha y hora para reagendar tu compromiso.</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                                            <Calendar size={12} /> Nueva Fecha
                                        </label>
                                        <input type="date" value={reschDate} min={todayStr()} 
                                            onChange={e => handleDateChange(e.target.value)} 
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl px-4 py-3 font-bold text-gray-900 transition-colors shadow-sm outline-none" />
                                    </div>

                                    {reschDate && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-t border-gray-100 pt-5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-4 flex items-center gap-1.5">
                                                <Clock size={12} /> Horarios disponibles
                                            </label>
                                            
                                            {slotsLoading ? (
                                                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
                                            ) : slots.length === 0 ? (
                                                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-[20px]">
                                                    <span className="text-sm font-medium">No hay horarios este día</span>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {slots.map(slot => (
                                                        <button key={slot} onClick={() => setReschSlot(slot)}
                                                            className={`py-2.5 px-1 rounded-[12px] text-xs font-black transition-all border-2
                                                                ${reschSlot === slot 
                                                                    ? 'bg-black text-white border-black shadow-md' 
                                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
                                                            {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        <button onClick={() => setIsRescheduling(false)}
                                            className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-[20px] hover:bg-gray-50 transition-colors">
                                            Atrás
                                        </button>
                                        <button onClick={handleRescheduleSubmit} disabled={!reschDate || !reschSlot || submittingResch}
                                            className="flex-[2] py-3.5 bg-black hover:bg-gray-900 disabled:opacity-30 text-white font-black text-sm rounded-[20px] transition-all flex items-center justify-center gap-2">
                                            {submittingResch ? <Loader2 size={16} className="animate-spin" /> : "Confirmar Cambio"}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {apptLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 size={32} className="animate-spin text-gray-300" />
                    <p className="text-sm font-medium text-gray-400">Cargando tus citas...</p>
                </div>
            ) : myAppts.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-[32px] text-center py-28 flex flex-col items-center shadow-sm mt-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm shadow-gray-100">
                        <Calendar size={36} className="text-gray-300" />
                    </div>
                    <h3 className="font-black text-xl text-gray-900 mb-2 tracking-tight">No tienes reservas</h3>
                    <p className="text-gray-400 mb-8 max-w-sm text-sm">Explora las instituciones disponibles y agenda tu primer turno en pocos segundos.</p>
                    <button onClick={onBookMore}
                        className="px-8 py-3.5 bg-black text-white font-black text-sm rounded-[20px] hover:bg-gray-800 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        Explorar lugares
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Segmented Control */}
                    <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md rounded-[20px] max-w-md mx-auto sm:mx-0">
                        <button onClick={() => setFilter('upcoming')} 
                            className={`flex-[1.2] py-2.5 text-xs sm:text-sm font-bold rounded-[16px] transition-all flex justify-center items-center gap-2 
                                ${filter === 'upcoming' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            Próximas <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === 'upcoming' ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>{upcoming.length}</span>
                        </button>
                        <button onClick={() => setFilter('past')} 
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-[16px] transition-all
                                ${filter === 'past' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            Historial
                        </button>
                        <button onClick={() => setFilter('cancelled')} 
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-[16px] transition-all
                                ${filter === 'cancelled' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            Canceladas
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        {displayList.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-[28px] border border-gray-100 border-dashed">
                                <Search size={28} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 text-sm font-medium">No hay citas en este grupo</p>
                            </div>
                        ) : (
                            displayList.map(a => <AppointmentCard key={a.id} app={a} onClick={() => setSelectedAppt(a)} onCancel={filter === 'upcoming' ? () => setCancelConfirmId(a.id) : undefined} />)
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
