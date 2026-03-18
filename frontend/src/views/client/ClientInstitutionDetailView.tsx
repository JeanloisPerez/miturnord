import { useState, useEffect, Suspense, lazy } from 'react';
import { ChevronLeft, CheckCircle, Clock, ChevronRight, Building2, MapPin, ChevronUp, ChevronDown, Phone, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { getInstitution, getServicesByInstitution, getServicesByBranch, getBranches, getAvailableSlots, createAppointment, getCustomFields } from '../../services/api';
import { fmt, todayStr, inputCls, FIELD_INPUTS, generateTurnCode, getTypeGradient } from './clientShared';
import type { BookStep, Institution, Branch, Service } from './clientShared';

const MapPicker = lazy(() => import('../../components/MapPicker'));
import { ImageUploader } from '../owner/ownerShared';

// ─── Mini Components ──────────────────────────────────────────────────────────
function StepBar({ step }: { step: BookStep }) {
    const labels = ['Sucursal', 'Servicio', 'Horario', 'Confirmar'];
    return (
        <div className="flex items-center gap-0 mb-6">
            {labels.map((l, i) => {
                const s = (i + 1) as BookStep;
                const done = step > s, active = step === s;
                return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                                ${active ? 'bg-black text-white shadow' : done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {done ? <CheckCircle size={14} /> : s}
                            </div>
                            <span className={`text-xs hidden sm:block ${active ? 'text-black font-medium' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{l}</span>
                        </div>
                        {i < labels.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                    </div>
                );
            })}
        </div>
    );
}

function WizardNav({ onBack, onNext, nextDisabled = false }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
    return (
        <div className="flex gap-2 pt-2">
            <button onClick={onBack}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold text-sm rounded-2xl hover:bg-gray-50 transition">
                ← Atrás
            </button>
            <button onClick={onNext} disabled={nextDisabled}
                className="flex-[2] py-3 bg-black hover:bg-gray-800 disabled:opacity-30 text-white font-bold text-sm rounded-2xl transition">
                Continuar →
            </button>
        </div>
    );
}

function SuccessScreen({ turnCode, institution, service, branch, date, slot, onMyAppts, onNew }:
    { turnCode: string; institution: Institution; service: Service | null; branch: Branch | null; date: string; slot: string; onMyAppts: () => void; onNew: () => void }) {
    return (
        <div className="max-w-md mx-auto px-4 py-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={38} className="text-emerald-500" />
            </div>
            <div>
                <p className="text-gray-500">Tu turno fue confirmado</p>
                <p className="text-5xl font-black text-gray-900 mt-1 tracking-widest">{turnCode}</p>
                <p className="text-gray-400 text-xs mt-1">Código de turno</p>
            </div>
            {/* QR simulado */}
            <div className="inline-block border-2 border-gray-200 rounded-2xl p-3 bg-white shadow-sm">
                <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-sm ${(i % 7 === 0 || i % 5 === 0 || i < 6 || i > 29) ? 'bg-gray-900' : 'bg-white border border-gray-100'}`} />
                    ))}
                </div>
            </div>
            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2.5">
                {[
                    ['Institución', institution.name],
                    service && ['Servicio', service.name],
                    branch && ['Sucursal', branch.name],
                    ['Fecha', fmt(date)],
                    ['Hora', slot],
                ].filter(Boolean).map((r: any) => (
                    <div key={r[0]} className="flex justify-between text-sm">
                        <span className="text-gray-500">{r[0]}</span>
                        <span className="font-semibold text-gray-900">{r[1]}</span>
                    </div>
                ))}
            </div>
            <div className="flex gap-3">
                <button onClick={onMyAppts}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold text-sm rounded-2xl hover:bg-gray-50 transition">
                    Mis turnos
                </button>
                <button onClick={onNew}
                    className="flex-1 py-3 bg-black text-white font-bold text-sm rounded-2xl hover:bg-gray-800 transition">
                    Nueva reserva
                </button>
            </div>
        </div>
    );
}


// ─── Main Component ───
export default function ClientInstitutionDetailView({
    institutionId, onBack, onMyAppts
}: {
    institutionId: string;
    onBack: () => void;
    onMyAppts: () => void;
}) {
    // Institution detail
    const [institution, setInstitution] = useState<Institution | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [detailLoading, setDetailLoading] = useState(true);

    // Booking wizard
    const [bookStep, setBookStep] = useState<BookStep>(0);
    const [selService, setSelService] = useState<Service | null>(null);
    const [selBranch, setSelBranch] = useState<Branch | null>(null);
    const [expandedMap, setExpandedMap] = useState<string | null>(null);
    const [selDate, setSelDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [selSlot, setSelSlot] = useState('');
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [bookLoading, setBookLoading] = useState(false);
    const [bookError, setBookError] = useState('');
    const [confirmedAppt, setConfirmedAppt] = useState<any>(null);
    const [turnCode, setTurnCode] = useState('');
    const [dynFields, setDynFields] = useState<any[]>([]);
    // Services filtered by selected branch
    const [branchServices, setBranchServices] = useState<Service[] | null>(null);
    const [branchSvcLoading, setBranchSvcLoading] = useState(false);

    useEffect(() => {
        setDetailLoading(true);
        Promise.all([
            getInstitution(institutionId),
            getServicesByInstitution(institutionId),
            getBranches(institutionId),
        ]).then(([full, svcs, brs]) => {
            setInstitution(full.data);
            setServices(svcs.data);
            setBranches(brs.data);
        }).finally(() => {
            setDetailLoading(false);
        });
    }, [institutionId]);

    // Re-fetch services when a branch is selected
    useEffect(() => {
        if (!selBranch) {
            setBranchServices(null);
            return;
        }
        setBranchSvcLoading(true);
        getServicesByBranch(selBranch.id)
            .then(r => setBranchServices(r.data))
            .catch(() => setBranchServices([]))
            .finally(() => setBranchSvcLoading(false));
    }, [selBranch]);

    // Services to display: filtered by branch if branch selected, otherwise all
    const displayedServices = selBranch
        ? (branchServices ?? [])
        : services;

    const handleServiceSelect = async (s: Service) => {
        setSelService(s);
        setBookStep(3); // branch already selected at step 0; go directly to slots
        try {
            const res = await getCustomFields(institutionId, s.id);
            setDynFields(res.data);
        } catch { }
    };

    const handleDateChange = async (date: string) => {
        setSelDate(date); setSelSlot(''); setSlots([]);
        if (!date || !selService || !institution) return;
        setSlotsLoading(true);
        try {
            const r = await getAvailableSlots({ institutionId: institution.id, serviceId: selService.id, date, branchId: selBranch?.id });
            setSlots(r.data?.slots || r.data || []);
        } catch { setSlots([]); }
        finally { setSlotsLoading(false); }
    };

    const handleBook = async () => {
        if (!institution || !selService || !selSlot || !selDate) return;
        setBookLoading(true); setBookError('');
        try {
            const r = await createAppointment({
                institution_id: institution.id,
                service_id: selService.id,
                branch_id: selBranch?.id,
                date: `${selDate}T${selSlot}:00`,
                notes,
                field_responses: Object.entries(fieldValues).map(([k, v]) => ({ field_id: k, value: v as string }))
            });
            setConfirmedAppt(r.data);
            setTurnCode(generateTurnCode(r.data.id));
        } catch (e: any) {
            setBookError(e.response?.data?.message || 'Error al agendar. Intenta otro horario.');
        } finally {
            setBookLoading(false);
        }
    };

    const resetWizard = () => {
        setConfirmedAppt(null); setTurnCode('');
        setBookStep(0); setSelService(null); setSelBranch(null);
        setSelDate(''); setSlots([]); setSelSlot('');
        setNotes(''); setFieldValues({});
        setBranchServices(null);
    };

    if (detailLoading || !institution) {
        return (
            <div className="flex justify-center py-32">
                <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (confirmedAppt) {
        return (
            <SuccessScreen
                turnCode={turnCode}
                institution={institution}
                service={selService}
                branch={selBranch}
                date={selDate}
                slot={selSlot}
                onMyAppts={onMyAppts}
                onNew={resetWizard}
            />
        );
    }

    // Prepare dynamic fields
    // Ensure dynFields works as a fallback array from service description or custom DB later

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 pb-20 space-y-5">
            {/* Back */}
            <button onClick={onBack}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition font-medium">
                <ChevronLeft size={16} /> Volver
            </button>

            {/* Institution hero card */}
            <div className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                {/* Cover with Background Image or Gradient */}
                {institution.logo_url ? (
                    <div className="h-44 relative bg-gray-100 flex items-center justify-center">
                        <img src={institution.logo_url} alt={institution.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>
                ) : (
                    <div className={`h-44 bg-gradient-to-br ${getTypeGradient(institution.institution_type?.name)} flex items-center justify-center relative`}>
                        <span className="text-7xl opacity-30 absolute inset-0 flex items-center justify-center select-none">
                            {institution.institution_type?.icon || '🏢'}
                        </span>
                        <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                            <span className="text-white font-black text-4xl">{institution.name[0]}</span>
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-black text-gray-900">{institution.name}</h1>
                            {institution.institution_type && (
                                <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    {institution.institution_type.icon} {institution.institution_type.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-700 text-xs font-semibold">Disponible</span>
                        </div>
                    </div>
                    {institution.description && (
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed">{institution.description}</p>
                    )}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>{services.length} servicio(s)</span>
                        <span>{branches.length} sucursal(es)</span>
                    </div>
                </div>
            </div>

            {/* ── Wizard ─────────────────────────── */}
            {/* STEP 0: Branch selection (shown before services) */}
            {bookStep === 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-black text-gray-900">Selecciona una sucursal</h2>
                    {branches.length === 0 ? (
                        <p className="text-gray-400 text-sm py-8 text-center">Sin sucursales disponibles</p>
                    ) : (
                        <div className="space-y-2">
                            {branches.map(b => (
                                <div key={b.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${selBranch?.id === b.id ? 'border-black' : 'border-gray-100'}`}>
                                    <button onClick={() => setSelBranch(b)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selBranch?.id === b.id ? 'bg-black' : 'bg-gray-100'}`}>
                                            <Building2 size={15} className={selBranch?.id === b.id ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{b.name}</p>
                                                {b.is_main && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md">Principal</span>}
                                            </div>
                                            {b.address && <p className="text-gray-400 text-xs truncate">{b.address}{b.city ? `, ${b.city}` : ''}</p>}
                                        </div>
                                        {selBranch?.id === b.id && <CheckCircle size={15} className="text-black shrink-0" />}
                                    </button>
                                    {selBranch?.id === b.id && b.latitude && b.longitude && (
                                        <div className="border-t border-gray-100">
                                            <button onClick={() => setExpandedMap(expandedMap === b.id ? null : b.id)}
                                                className="w-full px-4 py-2 flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 transition">
                                                <MapPin size={11} />{expandedMap === b.id ? 'Ocultar mapa' : 'Ver en mapa'}
                                                {expandedMap === b.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                            </button>
                                            {expandedMap === b.id && (
                                                <Suspense fallback={<div className="h-40 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>}>
                                                    <MapPicker value={{ lat: b.latitude, lng: b.longitude, address: b.address ?? '' }} readOnly height={200} />
                                                </Suspense>
                                            )}
                                            {b.phone && <p className="px-4 py-2 text-xs text-gray-400 flex items-center gap-1 border-t border-gray-100"><Phone size={11} />{b.phone}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {selBranch && (
                        <button
                            onClick={() => setBookStep(1)}
                            className="w-full py-3 bg-black hover:bg-gray-800 text-white font-bold text-sm rounded-2xl transition mt-2"
                        >
                            Ver servicios disponibles →
                        </button>
                    )}
                </div>
            )}

            {/* STEP 1: Services — filtered by branch */}
            {bookStep === 1 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setBookStep(0); setSelService(null); }} className="text-gray-400 hover:text-gray-700">
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="text-lg font-black text-gray-900">
                            Servicios
                            {selBranch && <span className="ml-2 text-sm font-medium text-blue-600">— {selBranch.name}</span>}
                        </h2>
                    </div>
                    {branchSvcLoading ? (
                        <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
                    ) : displayedServices.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <p className="text-gray-400 text-sm">Sin servicios disponibles en esta sucursal</p>
                            <button onClick={() => setBookStep(0)} className="text-blue-600 text-sm font-medium hover:underline">Cambiar sucursal</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedServices.map(s => (
                                <button key={s.id}
                                    onClick={() => handleServiceSelect(s)}
                                    className="w-full bg-white border border-gray-100 hover:border-gray-300 hover:shadow-md rounded-2xl p-4 text-left transition-all group flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {s.image_url ? (
                                            <img src={s.image_url} alt={s.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                                <Calendar size={20} className="text-blue-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{s.name}</p>
                                            {s.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{s.description}</p>}
                                            <div className="flex gap-3 mt-2">
                                                <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{s.duration} min</span>
                                                {s.price && <span className="text-xs font-semibold text-emerald-600">RD$ {Number(s.price).toFixed(2)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform hidden sm:flex">
                                        <ChevronRight size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {bookStep > 0 && bookStep <= 4 && (
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-6">
                    <StepBar step={bookStep as BookStep} />

                    {/* STEP 1 (inside wizard): redundant service picker if needed */}
                    {bookStep === 1 && (
                        <div className="space-y-3">
                            <p className="text-gray-400 text-sm text-center">Seleccionando servicio...</p>
                        </div>
                    )}

                    {/* STEP 2: branch (now inside wizard for confirmation/change) */}
                    {bookStep === 2 && (
                        <div className="space-y-3">
                            <p className="font-bold text-gray-900">Confirma la sucursal</p>
                            {branches.map(b => (
                                <div key={b.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${selBranch?.id === b.id ? 'border-black' : 'border-gray-100'}`}>
                                    <button onClick={() => setSelBranch(b)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selBranch?.id === b.id ? 'bg-black' : 'bg-gray-100'}`}>
                                            <Building2 size={15} className={selBranch?.id === b.id ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{b.name}</p>
                                                {b.is_main && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md">Principal</span>}
                                            </div>
                                            {b.address && <p className="text-gray-400 text-xs truncate">{b.address}{b.city ? `, ${b.city}` : ''}</p>}
                                        </div>
                                        {selBranch?.id === b.id && <CheckCircle size={15} className="text-black shrink-0" />}
                                    </button>
                                </div>
                            ))}
                            <WizardNav onBack={() => { setBookStep(1); }} onNext={() => setBookStep(3)} nextDisabled={!selBranch} />
                        </div>
                    )}

                    {/* STEP 3: date + slots */}
                    {bookStep === 3 && (
                        <div className="space-y-4">
                            <p className="font-bold text-gray-900">Elige fecha y horario</p>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Calendar size={12} /> Fecha
                                </label>
                                <input type="date" value={selDate} min={todayStr()}
                                    onChange={e => handleDateChange(e.target.value)} className={inputCls} />
                            </div>
                            {selDate && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <Clock size={12} /> Horarios disponibles — {fmt(selDate)}
                                    </label>
                                    {slotsLoading ? (
                                        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
                                    ) : slots.length === 0 ? (
                                        <div className="flex items-center gap-2 py-6 justify-center text-gray-400 text-sm">
                                            <AlertCircle size={16} />Sin horarios disponibles
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                            {slots.map(slot => (
                                                <button key={slot} onClick={() => setSelSlot(slot)}
                                                    className={`py-2.5 px-1 rounded-xl text-xs font-bold border-2 transition-all
                                                        ${selSlot === slot ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}>
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <WizardNav
                                onBack={() => { setBookStep(2); setSelSlot(''); setSlots([]); setSelDate(''); }}
                                onNext={() => setBookStep(4)} nextDisabled={!selSlot} />
                        </div>
                    )}

                    {/* STEP 4: confirm */}
                    {bookStep === 4 && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Resumen</p>
                                {[
                                    ['Institución', institution.name],
                                    ['Servicio', selService?.name],
                                    selBranch && ['Sucursal', selBranch.name],
                                    ['Fecha', fmt(selDate)],
                                    ['Hora', selSlot],
                                    selService?.price && ['Precio', `RD$ ${Number(selService.price).toFixed(2)}`],
                                ].filter(Boolean).map((row: any) => (
                                    <div key={row[0]} className="flex justify-between text-sm">
                                        <span className="text-gray-500">{row[0]}</span>
                                        <span className="text-gray-900 font-semibold text-right max-w-[60%]">{row[1]}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Dynamic fields */}
                            {dynFields.length > 0 && (
                                <div className="space-y-3">
                                    <p className="font-bold text-sm text-gray-900">Información requerida</p>
                                    {dynFields.map((f: any) => (
                                        <div key={f.id}>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                                            </label>
                                            {f.field_type === 'FILE' ? (
                                                <ImageUploader
                                                    value={fieldValues[f.id] || ''}
                                                    onChange={val => setFieldValues(v => ({ ...v, [f.id]: val }))}
                                                    label=""
                                                />
                                            ) : f.field_type === 'SELECT' ? (
                                                <select value={fieldValues[f.id] || ''} required={f.required}
                                                    onChange={e => setFieldValues(v => ({ ...v, [f.id]: e.target.value }))} className={inputCls}>
                                                    <option value="">Selecciona...</option>
                                                    {JSON.parse(f.options || '[]').map((o: string) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <input type={FIELD_INPUTS[f.field_type] || 'text'} required={f.required}
                                                    value={fieldValues[f.id] || ''} placeholder={f.placeholder || ''}
                                                    onChange={e => setFieldValues(v => ({ ...v, [f.id]: e.target.value }))} className={inputCls} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notas <span className="font-normal text-gray-400">(opcional)</span></label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    placeholder="Indicaciones especiales..." className={`${inputCls} resize-none`} />
                            </div>
                            {bookError && (
                                <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5" />{bookError}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button onClick={() => setBookStep(3)}
                                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold text-sm rounded-2xl hover:bg-gray-50 transition">
                                    ← Atrás
                                </button>
                                <button onClick={handleBook} disabled={bookLoading}
                                    className="flex-[2] py-3 bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2">
                                    {bookLoading ? <><Loader2 size={14} className="animate-spin" />Agendando...</> : 'Confirmar turno'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
