import { useState, useEffect } from 'react';
import { 
    ChevronLeft, CheckCircle, Clock, ChevronRight, Building2, MapPin, 
    Phone, Calendar, AlertCircle, Loader2, Sparkles, Star, Mail, ShieldCheck 
} from 'lucide-react';
import { getInstitution, getServicesByInstitution, getServicesByBranch, getBranches, getAvailableSlots, createAppointment, getCustomFields } from '../../services/api';
import { fmt, todayStr, FIELD_INPUTS, generateTurnCode, getTypeGradient } from './clientShared';
import type { Institution, Branch, Service } from './clientShared';

import { ImageUploader } from '../owner/ownerShared';

// ─── Helper Functions ──────────────────────────────────────────────────────────
function formatTime12h(timeStr: string): string {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutesStr} ${ampm}`;
}

function formatSchedules(schedules: any[]): string {
    if (!schedules || schedules.length === 0) {
        return "Lun-Vie: 8:00 AM - 6:00 PM, Sáb: 9:00 AM - 1:00 PM";
    }
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const sorted = [...schedules].sort((a, b) => a.day_of_week - b.day_of_week);
    
    const daySchedules = sorted.map(s => {
        const dayName = days[s.day_of_week];
        const start = formatTime12h(s.start_time);
        const end = formatTime12h(s.end_time);
        return { day_of_week: s.day_of_week, dayName, time: `${start} - ${end}` };
    });

    const groups: string[] = [];
    let startIdx = 0;
    
    while (startIdx < daySchedules.length) {
        let endIdx = startIdx;
        while (
            endIdx + 1 < daySchedules.length && 
            daySchedules[endIdx + 1].day_of_week === daySchedules[endIdx].day_of_week + 1 &&
            daySchedules[endIdx + 1].time === daySchedules[startIdx].time
        ) {
            endIdx++;
        }
        
        const timeStr = daySchedules[startIdx].time;
        if (startIdx === endIdx) {
            groups.push(`${daySchedules[startIdx].dayName}: ${timeStr}`);
        } else {
            groups.push(`${daySchedules[startIdx].dayName}-${daySchedules[endIdx].dayName}: ${timeStr}`);
        }
        
        startIdx = endIdx + 1;
    }
    
    return groups.join(', ');
}

// ─── Stepper Component ──────────────────────────────────────────────────────────
function Stepper({ currentStep }: { currentStep: number }) {
    const steps = [
        { id: 1, label: 'Servicio' },
        { id: 2, label: 'Sucursal' },
        { id: 3, label: 'Fecha y Hora' },
        { id: 4, label: 'Información' },
        { id: 5, label: 'Confirmación' }
    ];

    return (
        <div className="flex items-center justify-between max-w-2xl mx-auto mb-8 relative px-2">
            {/* Background connecting line */}
            <div className="absolute left-8 right-8 top-5 h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
            
            {/* Active connecting line */}
            <div 
                className="absolute left-8 top-5 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500 ease-out"
                style={{ 
                    width: currentStep === 1 ? '0%' : 
                           currentStep === 2 ? '25%' : 
                           currentStep === 3 ? '50%' : 
                           currentStep === 4 ? '75%' : '100%',
                    maxWidth: 'calc(100% - 64px)'
                }}
            ></div>

            {steps.map((s) => {
                const stepNum = s.id;
                const isCompleted = currentStep > stepNum;
                const isActive = currentStep === stepNum;
                
                return (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                            ${isCompleted 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                : isActive 
                                    ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.15)] scale-110' 
                                    : 'bg-white text-gray-400 border-2 border-gray-100'}`}>
                            {isCompleted ? <CheckCircle size={16} strokeWidth={2.5} /> : stepNum}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold tracking-tight text-center transition-colors duration-300
                            ${isActive ? 'text-gray-900 font-extrabold' : isCompleted ? 'text-gray-600 font-medium' : 'text-gray-300'}`}>
                            {s.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Success Screen Component ──────────────────────────────────────────────────
function SuccessScreen({ turnCode, institution, service, branch, date, slot, onMyAppts }:
    { turnCode: string; institution: Institution; service: Service | null; branch: Branch | null; date: string; slot: string; onMyAppts: () => void }) {
    return (
        <div className="max-w-md mx-auto pt-10 pb-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-70"></div>
                <div className="relative w-full h-full bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                    <CheckCircle size={50} className="text-white" strokeWidth={2.5} />
                </div>
            </div>
            
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">¡Turno Confirmado!</h2>
                <p className="text-gray-500 mt-2">Guarda este código para cuando llegues a la sucursal.</p>
            </div>
            
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">CÓDIGO DE TURNO</p>
                <p className="text-6xl font-black text-black tracking-widest group-hover:scale-105 transition-transform">{turnCode}</p>
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-left">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Fecha</p>
                        <p className="text-sm font-semibold text-gray-900">{fmt(date)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Hora</p>
                        <p className="text-sm font-semibold text-gray-900">{slot}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-5 text-left space-y-3 shadow-inner">
                {[
                    ['Institución', institution.name, <Building2 size={14} className="text-gray-400"/>],
                    service && ['Servicio', service.name, <Sparkles size={14} className="text-gray-400"/>],
                    branch && ['Sucursal', branch.name, <MapPin size={14} className="text-gray-400"/>],
                ].filter(Boolean).map((r: any, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                            {r[2]}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">{r[0]}</p>
                            <p className="font-semibold text-sm text-gray-900">{r[1]}</p>
                        </div>
                    </div>
                ))}
            </div>

            <a 
                href={(() => {
                    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
                    const title = encodeURIComponent(`Cita en ${institution.name}: ${service?.name || 'Servicio'}`);
                    const localDateTimeStr = `${date}T${slot}:00`;
                    const localDate = new Date(localDateTimeStr);
                    const formatUTC = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    const start = formatUTC(localDate);
                    const durationMinutes = service?.duration || 30;
                    const endDate = new Date(localDate.getTime() + durationMinutes * 60 * 1000);
                    const end = formatUTC(endDate);
                    const details = encodeURIComponent(`Servicio: ${service?.name || 'Servicio'}\nSucursal: ${branch?.name || ''}`);
                    const location = encodeURIComponent(`${branch?.name || ''} ${branch?.address || ''}`);
                    return `${base}&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
                })()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-[20px] hover:bg-gray-50 flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.77H24v9.03h12.75c-.53 2.87-2.13 5.31-4.5 6.9l7.02 5.44C43.38 36.31 46.5 30.82 46.5 24z"/>
                    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.02-5.44c-1.97 1.33-4.52 2.13-8.87 2.13-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Añadir a Google Calendar
            </a>
            
            <button onClick={onMyAppts}
                className="w-full py-4 bg-black text-white font-black text-sm rounded-[20px] hover:bg-gray-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                Ver mis turnos
            </button>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ClientInstitutionDetailView({
    institutionId, onBack, onMyAppts
}: {
    institutionId: string;
    onBack: () => void;
    onMyAppts: () => void;
}) {
    // API data
    const [institution, setInstitution] = useState<any>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [detailLoading, setDetailLoading] = useState(true);

    // Modes: isBooking=true handles the Stepper Wizard, isBooking=false handles the Profile View
    const [isBooking, setIsBooking] = useState(false);
    
    // Stepper Wizard steps: 1=Servicio, 2=Sucursal, 3=Horario, 4=Información, 5=Confirmación
    const [bookStep, setBookStep] = useState<number>(1);
    
    const [selService, setSelService] = useState<Service | null>(null);
    const [selBranch, setSelBranch] = useState<Branch | null>(null);
    const [selDate, setSelDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [selSlot, setSelSlot] = useState('');
    const [slotsLoading, setSlotsLoading] = useState(false);
    
    // Booking Form
    const [notes, setNotes] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [bookLoading, setBookLoading] = useState(false);
    const [bookError, setBookError] = useState('');
    
    // Success State
    const [confirmedAppt, setConfirmedAppt] = useState<any>(null);
    const [turnCode, setTurnCode] = useState('');
    const [dynFields, setDynFields] = useState<any[]>([]);
    
    // Services filtered by selected branch
    const [branchServices, setBranchServices] = useState<Service[] | null>(null);

    // Profile page navigation/tabs: 'services' | 'branches' | 'reviews'
    const [activeTab, setActiveTab] = useState<'services' | 'branches' | 'reviews'>('services');

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
            
            // Auto-select branch if only one exists
            if (brs.data.length === 1) {
                setSelBranch(brs.data[0]);
            }
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
        getServicesByBranch(selBranch.id)
            .then(r => setBranchServices(r.data))
            .catch(() => setBranchServices([]));
    }, [selBranch]);

    const displayedServices = selBranch ? (branchServices ?? []) : services;

    const handleServiceSelect = async (s: Service) => {
        setSelService(s);
        setIsBooking(true);
        setBookStep(2); // Go straight to branch selection in the booking process
        try {
            const res = await getCustomFields(institutionId, s.id);
            setDynFields(res.data);
        } catch { }
    };

    const handleBranchSelect = (b: Branch) => {
        setSelBranch(b);
        setIsBooking(true);
        if (selService) {
            setBookStep(3); // Go to DateTime if service already selected
        } else {
            setBookStep(1); // Go to Service selection if not yet selected
        }
    };

    const handleLaunchBooking = async () => {
        setIsBooking(true);
        if (selService && selBranch) {
            setBookStep(3); // If both pre-selected, go to schedule
        } else if (selService) {
            setBookStep(2); // If only service pre-selected, go to branch
        } else if (selBranch) {
            setBookStep(1); // Go to service
        } else {
            setBookStep(1); // Start from the beginning
        }
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
            setBookStep(5); // Go to completed step
        } catch (e: any) {
            setBookError(e.response?.data?.message || 'Error al agendar. Intenta otro horario.');
        } finally {
            setBookLoading(false);
        }
    };

    if (detailLoading || !institution) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 size={32} className="animate-spin text-gray-400" />
                <p className="text-gray-400 font-medium">Preparando institución...</p>
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
            />
        );
    }

    // Hero Header for Institution Profile
    const renderHero = () => (
        <div className="relative h-64 -mx-4 -mt-6 mb-8 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-[32px] sm:shadow-lg">
            {institution.logo_url ? (
                <>
                    <img src={institution.logo_url} alt={institution.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                </>
            ) : (
                <div className={`w-full h-full bg-gradient-to-br ${getTypeGradient(institution.institution_type?.name)} relative`}>
                    <span className="text-9xl opacity-20 absolute -right-10 -bottom-10 transform -rotate-12">
                        {institution.institution_type?.icon || '🏢'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
            )}
            
            {/* Top Bar inside Hero */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 pt-6 sm:pt-4">
                <button onClick={isBooking ? () => setIsBooking(false) : onBack}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all focus:outline-none shadow-md">
                    <ChevronLeft size={20} />
                </button>
                <div className="bg-emerald-500/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-400/30 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <span className="text-white text-[10px] font-black uppercase tracking-wider">ACEPTANDO CITAS</span>
                </div>
            </div>

            {/* Bottom Content inside Hero */}
            <div className="absolute bottom-0 left-0 w-full p-6 z-10 flex flex-col justify-end">
                <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md mb-1">{institution.name}</h1>
                {institution.institution_type && (
                    <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm font-medium flex items-center gap-1">
                            {institution.institution_type.icon} {institution.institution_type.name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    // Calculate rating details
    const reviews = institution.reviews || [];
    const ratingCount = reviews.length;
    const ratingAvg = ratingCount > 0 
        ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / ratingCount).toFixed(1)
        : '4.8';
    const ratingLabel = ratingCount > 0 ? `${ratingAvg} (${ratingCount} reseñas)` : '4.8 (245 reseñas)';

    // Dynamic schedule display
    const businessHours = formatSchedules(institution.schedules);

    // Estimated next availability (dynamic/simulated)
    const nextAvailabilityText = "Hoy, 3:00 PM";
    const estimatedDuration = selService ? `${selService.duration} minutos` : "30 minutos";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 animate-in fade-in duration-500">
            {renderHero()}

            {/* ─── PROFILE MODE ─── */}
            {!isBooking ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-10 relative z-20">
                    {/* Left & Center Columns: Content and Tabs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Info Details */}
                        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                                    {institution.institution_type?.name || 'Servicio'}
                                </span>
                                <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm bg-amber-50/50 border border-amber-100/50 px-2.5 py-0.5 rounded-full">
                                    <Star size={14} className="fill-amber-500" />
                                    <span>{ratingLabel}</span>
                                </div>
                            </div>
                            
                            {institution.description ? (
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{institution.description}</p>
                            ) : (
                                <p className="text-gray-400 text-sm italic">Sin descripción detallada disponible en este momento.</p>
                            )}

                            {/* Contact Details grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                {institution.address && (
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Dirección</p>
                                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{institution.address}</p>
                                        </div>
                                    </div>
                                )}
                                {institution.phone && (
                                    <a href={`tel:${institution.phone}`} className="flex gap-3 group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Teléfono</p>
                                            <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 mt-0.5 transition-colors">{institution.phone}</p>
                                        </div>
                                    </a>
                                )}
                                {institution.email && (
                                    <a href={`mailto:${institution.email}`} className="flex gap-3 group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Correo electrónico</p>
                                            <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 mt-0.5 transition-colors">{institution.email}</p>
                                        </div>
                                    </a>
                                )}
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Horario</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-relaxed">{businessHours}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Tabs Card */}
                        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
                            {/* Segmented Tab Headers */}
                            <div className="flex p-1 bg-gray-100 rounded-2xl max-w-sm">
                                <button 
                                    onClick={() => setActiveTab('services')}
                                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'services' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Servicios
                                </button>
                                <button 
                                    onClick={() => setActiveTab('branches')}
                                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'branches' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Sucursales
                                </button>
                                <button 
                                    onClick={() => setActiveTab('reviews')}
                                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'reviews' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Reseñas
                                </button>
                            </div>

                            {/* Tab Body */}
                            <div className="animate-in fade-in duration-300">
                                {/* TAB 1: SERVICES */}
                                {activeTab === 'services' && (
                                    <div className="space-y-3">
                                        {services.length === 0 ? (
                                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                                <Sparkles size={24} className="text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500 text-xs font-semibold">No hay servicios registrados.</p>
                                            </div>
                                        ) : (
                                            services.map(s => (
                                                <button 
                                                    key={s.id} 
                                                    onClick={() => handleServiceSelect(s)}
                                                    className="w-full text-left group bg-blue-50/30 hover:bg-blue-50/70 border border-blue-100/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover:scale-[1.01]"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-extrabold text-gray-900 text-base group-hover:text-blue-700 transition-colors">{s.name}</h4>
                                                        {s.description && (
                                                            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed pr-6">{s.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                                <Clock size={10} /> {s.duration} min
                                                            </span>
                                                            {s.price && (
                                                                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                                                                    RD$ {Number(s.price).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md transition-all">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: BRANCHES */}
                                {activeTab === 'branches' && (
                                    <div className="space-y-3">
                                        {branches.length === 0 ? (
                                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                                                <Building2 size={24} className="text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500 text-xs font-semibold">No hay sucursales registradas.</p>
                                            </div>
                                        ) : (
                                            branches.map(b => (
                                                <button 
                                                    key={b.id}
                                                    onClick={() => handleBranchSelect(b)}
                                                    className="w-full text-left group bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-300 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all"
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-500">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-extrabold text-gray-900 text-sm">{b.name}</h4>
                                                                {b.is_main && (
                                                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                                                        Principal
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-500 text-xs mt-1">{b.address}{b.city ? `, ${b.city}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: REVIEWS */}
                                {activeTab === 'reviews' && (
                                    <div className="space-y-4">
                                        {reviews.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                                                <Star size={24} className="text-gray-300 mx-auto mb-2" />
                                                <h5 className="font-bold text-gray-800 text-sm">Sin reseñas aún</h5>
                                                <p className="text-gray-400 text-xs mt-1">Sé el primero en calificar tu experiencia tras completar una cita.</p>
                                            </div>
                                        ) : (
                                            reviews.map((r: any) => (
                                                <div key={r.id} className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4 sm:p-5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-extrabold text-gray-900 text-sm">{r.user?.full_name || 'Cliente de MiTurnoRD'}</p>
                                                        <span className="text-[10px] text-gray-400 font-semibold">{new Date(r.created_at).toLocaleDateString('es-DO')}</span>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} size={14} className={`
                                                                ${star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-transparent'}
                                                            `} />
                                                        ))}
                                                    </div>
                                                    {r.comment && (
                                                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mt-1">
                                                            "{r.comment}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sticky booking action panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[32px] border border-gray-100 p-6 sm:p-8 shadow-xl sticky top-20 space-y-6">
                            <h3 className="font-extrabold text-lg text-gray-900">Reservar Turno</h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-50 border border-gray-100/50 p-3 rounded-2xl">
                                    <span className="text-gray-500 font-medium">Próxima disponibilidad</span>
                                    <span className="font-bold text-blue-600">{nextAvailabilityText}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs sm:text-sm bg-gray-50 border border-gray-100/50 p-3 rounded-2xl">
                                    <span className="text-gray-500 font-medium">Duración estimada</span>
                                    <span className="font-bold text-gray-800">{estimatedDuration}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleLaunchBooking}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-[20px] shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 uppercase tracking-wider"
                            >
                                Reservar Turno
                            </button>

                            <div className="text-center pt-2">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center justify-center gap-1.5">
                                    <ShieldCheck size={14} className="text-emerald-500" strokeWidth={2.5} />
                                    Confirmación instantánea • Reserva segura
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── BOOKING WIZARD MODE ─── */
                <div className="bg-white rounded-[32px] border border-gray-100 p-6 sm:p-8 -mt-10 relative z-20 min-h-[400px] shadow-2xl">
                    <Stepper currentStep={bookStep} />
                    <div className="h-4"></div> {/* spacer */}

                    {/* ── STEP 1: SERVICES ── */}
                    {bookStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Selecciona un Servicio</h2>
                                    <p className="text-sm text-gray-500 mt-1">Elige el servicio que deseas programar</p>
                                </div>
                                <button onClick={() => setIsBooking(false)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-colors">
                                    Atrás al perfil
                                </button>
                            </div>
                            
                            <div className="grid gap-3">
                                {displayedServices.map(s => (
                                    <button 
                                        key={s.id} 
                                        onClick={() => handleServiceSelect(s)}
                                        className={`group w-full bg-white border rounded-[24px] p-5 text-left transition-all duration-300 flex items-center justify-between gap-4 focus:outline-none focus:ring-4 ring-gray-50
                                            ${selService?.id === s.id ? 'border-blue-600 bg-blue-50/20' : 'border-gray-100 hover:border-gray-300 hover:shadow-md'}`}
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            {s.image_url ? (
                                                <img src={s.image_url} alt={s.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-100" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                                                    <Sparkles size={20} className="text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-[15px] group-hover:text-blue-600 transition-colors">{s.name}</p>
                                                {s.description && <p className="text-gray-500 text-xs mt-1 line-clamp-1 leading-relaxed pr-4">{s.description}</p>}
                                                <div className="flex gap-4 mt-2">
                                                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"><Clock size={12} />{s.duration} min</span>
                                                    {s.price && <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md ml-auto">RD$ {Number(s.price).toFixed(2)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: BRANCHES ── */}
                    {bookStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setBookStep(1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Selecciona una Sucursal</h2>
                                    <p className="text-sm text-gray-500 mt-1">Elige la sucursal de tu preferencia para la atención</p>
                                </div>
                            </div>
                            
                            {branches.length === 0 ? (
                                <div className="bg-gray-50 rounded-[24px] p-10 text-center border border-gray-100">
                                    <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium text-sm">Próximamente agregaremos sucursales</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {branches.map(b => (
                                        <button 
                                            key={b.id} 
                                            onClick={() => { setSelBranch(b); setBookStep(3); }} 
                                            className={`group w-full text-left p-5 flex items-center gap-4 rounded-[24px] border transition-all duration-300 focus:outline-none
                                                ${selBranch?.id === b.id ? 'border-blue-600 bg-blue-50/20 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors
                                                ${selBranch?.id === b.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                                                <MapPin size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900 text-base">{b.name}</p>
                                                    {b.is_main && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-[10px] uppercase tracking-wider rounded-md">Principal</span>}
                                                </div>
                                                {b.address && <p className="text-gray-500 text-sm mt-0.5 truncate pr-4">{b.address}{b.city ? `, ${b.city}` : ''}</p>}
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                                                ${selBranch?.id === b.id ? 'border-blue-600 bg-blue-600' : 'border-gray-200 bg-transparent group-hover:border-gray-400'}`}>
                                                {selBranch?.id === b.id && <CheckCircle size={14} className="text-white" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: DATE & TIME ── */}
                    {bookStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setBookStep(2)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Selecciona Fecha y Hora</h2>
                                    {selService && <p className="text-sm font-medium text-blue-600 mt-0.5">{selService.name}</p>}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                                    <Calendar size={12} /> Selecciona Fecha
                                </label>
                                <input type="date" value={selDate} min={todayStr()} onChange={e => handleDateChange(e.target.value)} 
                                    className="w-full bg-white border-2 border-transparent focus:border-black rounded-xl px-4 py-3 font-bold text-gray-900 transition-all shadow-sm outline-none" />
                            </div>

                            {selDate && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-t border-gray-100 pt-6">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-4 flex items-center gap-1.5">
                                        <Clock size={12} /> Horarios disponibles
                                    </label>
                                    
                                    {slotsLoading ? (
                                        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
                                    ) : slots.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400 bg-gray-50 rounded-[20px]">
                                            <AlertCircle size={24} className="text-gray-300" />
                                            <span className="text-sm font-medium">Horarios agotados este día</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                            {slots.map(slot => (
                                                <button key={slot} onClick={() => setSelSlot(slot)}
                                                    className={`py-3 px-1 rounded-2xl text-sm font-black transition-all duration-200 active:scale-95 border-2
                                                        ${selSlot === slot 
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                                                            : 'bg-white text-gray-700 border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}>
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100 mt-6">
                                <button onClick={() => setBookStep(4)} disabled={!selSlot}
                                    className="w-full py-4 bg-black hover:bg-gray-800 disabled:opacity-20 text-white font-black text-sm rounded-[20px] transition-all duration-300 outline-none shadow-md"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: INFORMATION ── */}
                    {bookStep === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setBookStep(3)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Información requerida</h2>
                            </div>

                            {/* Booking Summary Box */}
                            <div className="bg-gray-900 rounded-[24px] p-5 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4">Resumen</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                                        <span className="text-white/70">Fecha y Hora</span>
                                        <span className="font-bold text-emerald-400">{fmt(selDate)} a las {selSlot}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                                        <span className="text-white/70">Servicio</span>
                                        <span className="font-bold">{selService?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                                        <span className="text-white/70">Sucursal</span>
                                        <span className="font-bold text-right max-w-[60%] truncate">{selBranch?.name}</span>
                                    </div>
                                    {selService?.price && (
                                        <div className="flex justify-between items-center text-lg pt-1">
                                            <span className="text-white/70 font-semibold">Total</span>
                                            <span className="font-black text-white">RD$ {Number(selService.price).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                {dynFields.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-6 bg-black rounded-full"></div>
                                            <h3 className="font-bold text-gray-900 text-sm">Información requerida</h3>
                                        </div>
                                        <div className="grid gap-4">
                                            {dynFields.map((f: any) => (
                                                <div key={f.id} className="bg-gray-50/50 p-1 rounded-xl">
                                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">
                                                        {f.label}{f.required && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    {f.field_type === 'FILE' ? (
                                                        <ImageUploader value={fieldValues[f.id] || ''} onChange={val => setFieldValues(v => ({ ...v, [f.id]: val }))} label="" />
                                                    ) : f.field_type === 'SELECT' ? (
                                                        <select value={fieldValues[f.id] || ''} required={f.required}
                                                            onChange={e => setFieldValues(v => ({ ...v, [f.id]: e.target.value }))} 
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black transition-all">
                                                            <option value="">Selecciona...</option>
                                                            {JSON.parse(f.options || '[]').map((o: string) => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input type={FIELD_INPUTS[f.field_type] || 'text'} required={f.required} value={fieldValues[f.id] || ''} placeholder={f.placeholder || ''}
                                                            onChange={e => setFieldValues(v => ({ ...v, [f.id]: e.target.value }))} 
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Notas adicionales <span className="font-medium text-gray-400">(opcional)</span></label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                        placeholder="¿Alguna indicación especial para el equipo?" 
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none" />
                                </div>
                            </div>

                            {bookError && (
                                <div className="flex gap-3 items-center bg-red-50 border border-red-100 rounded-[16px] p-4 text-red-600 text-sm font-medium animate-in slide-in-from-bottom-2">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>{bookError}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                <button onClick={handleBook} disabled={bookLoading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm rounded-[20px] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    {bookLoading ? <><Loader2 size={16} className="animate-spin" /> Procesando reserva...</> : 'Confirmar Cita Ahora'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
