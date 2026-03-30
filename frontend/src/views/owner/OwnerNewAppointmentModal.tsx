import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Search, Loader2 } from 'lucide-react';
import { getServicesByInstitution, getBranches, getAvailableSlots, searchUsers, createStaffAppointment } from '../../services/api';
import { btn, ic } from './ownerShared';

export default function OwnerNewAppointmentModal({ instId, onClose, onRefresh }: { instId: string; onClose: () => void; onRefresh: () => void }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Step 1: Client Selection
    const [isWalkIn, setIsWalkIn] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    
    // Form Data
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');
    const [walkInEmail, setWalkInEmail] = useState('');
    
    // Step 2 & 3: Service, Branch, Date, Time
    const [services, setServices] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [selService, setSelService] = useState('');
    const [selBranch, setSelBranch] = useState('');
    const [date, setDate] = useState('');
    
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selSlot, setSelSlot] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        getServicesByInstitution(instId).then((r: any) => setServices(r.data));
        getBranches(instId).then((r: any) => setBranches(r.data));
    }, [instId]);

    useEffect(() => {
        if (!searchQ || searchQ.length < 2) {
            setSearchResults([]);
            return;
        }
        const delay = setTimeout(() => {
            setSearching(true);
            searchUsers(searchQ).then((r: any) => setSearchResults(r.data)).finally(() => setSearching(false));
        }, 500);
        return () => clearTimeout(delay);
    }, [searchQ]);

    useEffect(() => {
        if (selService && date) {
            setLoadingSlots(true);
            getAvailableSlots({ institutionId: instId, serviceId: selService, date, ...(selBranch ? { branchId: selBranch } : {}) })
                .then((r: any) => setSlots(r.data.slots.filter((s: any) => s.available).map((s: any) => s.time)))
                .finally(() => setLoadingSlots(false));
        } else {
            setSlots([]);
        }
    }, [selService, date, selBranch, instId]);

    const handleSubmit = async () => {
        if (!selService || !date || !selSlot) return;
        if (!isWalkIn && !selectedUser) return;
        if (isWalkIn && !walkInName) return;

        setLoading(true);
        try {
            const dateTime = `${date}T${selSlot}:00`;
            const payload: any = {
                institution_id: instId,
                service_id: selService,
                date: new Date(dateTime).toISOString(),
                notes: notes || undefined,
            };

            if (selBranch) payload.branch_id = selBranch;

            if (isWalkIn) {
                payload.walk_in_name = walkInName;
                if (walkInPhone) payload.walk_in_phone = walkInPhone;
                if (walkInEmail) payload.walk_in_email = walkInEmail;
            } else {
                payload.user_id = selectedUser.id;
            }

            await createStaffAppointment(payload);
            onRefresh();
            onClose();
        } catch (e) {
            alert('Error al crear la cita. Verifique la disponibilidad.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Nueva Cita Interna</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full"><X size={18} /></button>
                </div>

                <div className="p-6 overflow-y-auto w-full">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h4 className="font-semibold text-sm text-gray-800 border-b pb-2">Paso 1: Seleccionar Cliente</h4>
                            
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsWalkIn(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${!isWalkIn ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>Cliente existente</button>
                                <button type="button" onClick={() => setIsWalkIn(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${isWalkIn ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>Cliente nuevo (Walk-in)</button>
                            </div>

                            {isWalkIn ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
                                        <div className="relative">
                                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="Ej. Juan Pérez" className={`${ic} pl-9`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono (Opcional)</label>
                                        <div className="relative">
                                            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} placeholder="Ej. 809-555-0000" className={`${ic} pl-9`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico (Opcional)</label>
                                        <div className="relative">
                                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="email" value={walkInEmail} onChange={e => setWalkInEmail(e.target.value)} placeholder="Ej. correo@ejemplo.com" className={`${ic} pl-9`} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedUser ? (
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-blue-900 text-sm">{selectedUser.full_name}</p>
                                                <p className="text-xs text-blue-700">{selectedUser.email} {selectedUser.phone ? `· ${selectedUser.phone}` : ''}</p>
                                            </div>
                                            <button onClick={() => setSelectedUser(null)} className="text-blue-500 hover:text-blue-700 text-xs font-medium underline">Cambiar</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="relative">
                                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar por nombre, correo o teléfono..." className={`${ic} pl-9`} />
                                                {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                                            </div>
                                            
                                            {searchResults.length > 0 && (
                                                <div className="mt-2 border border-gray-100 rounded-lg divide-y max-h-48 overflow-y-auto">
                                                    {searchResults.map(u => (
                                                        <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQ(''); setSearchResults([]); }} className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                                                                <p className="text-xs text-gray-500">{u.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <h4 className="font-semibold text-sm text-gray-800 border-b pb-2">Paso 2: Detalles del Servicio</h4>
                            
                            {branches.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Sucursal (Opcional)</label>
                                    <select value={selBranch} onChange={e => setSelBranch(e.target.value)} className={ic}>
                                        <option value="">Cualquier sucursal / Sin sucursal</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Servicio *</label>
                                <select value={selService} onChange={e => setSelService(e.target.value)} required className={ic}>
                                    <option value="" disabled>Selecciona un servicio</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha *</label>
                                    <div className="relative">
                                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="date" value={date} onChange={e => { setDate(e.target.value); setSelSlot(''); }} required min={new Date().toISOString().split('T')[0]} className={`${ic} pl-9`} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Hora *</label>
                                    <div className="relative">
                                        <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select value={selSlot} onChange={e => setSelSlot(e.target.value)} required disabled={!selService || !date || loadingSlots} className={`${ic} pl-9`}>
                                            <option value="" disabled>{loadingSlots ? 'Cargando...' : 'Selecciona una hora'}</option>
                                            {slots.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    {date && selService && slots.length === 0 && !loadingSlots && <p className="text-xs text-red-500 mt-1">No hay horarios disponibles.</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notas internas (Opcional)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${ic} resize-none`} placeholder="Ej. Cliente solicitó atención especial..." />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center bg-white rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition">
                        Cancelar
                    </button>
                    
                    {step === 1 ? (
                        <button 
                            type="button" 
                            disabled={!isWalkIn ? !selectedUser : !walkInName}
                            onClick={() => setStep(2)} 
                            className={`${btn} w-32`}>
                            Continuar
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition">
                                Volver
                            </button>
                            <button 
                                type="button" 
                                disabled={loading || !selService || !date || !selSlot}
                                onClick={handleSubmit} 
                                className={`${btn} w-32 flex justify-center items-center`}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Crear Cita'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
