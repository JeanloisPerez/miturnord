import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import { getSchedulesByInstitution, createSchedule, updateSchedule, deleteSchedule } from '../../services/api';
import { Hdr, DAYS, Spinner } from './ownerShared';

export default function OwnerSchedulesView({ instId }: { instId: string }) {
    const [scheds, setScheds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingDows, setProcessingDows] = useState<Set<number>>(new Set());

    useEffect(() => {
        getSchedulesByInstitution(instId).then(r => setScheds(r.data)).finally(() => setLoading(false));
    }, [instId]);

    const handleToggle = async (dow: number, isActive: boolean) => {
        setProcessingDows(prev => new Set(prev).add(dow));
        try {
            if (isActive) {
                // Delete all schedules for this day
                const toDelete = scheds.filter(s => s.day_of_week === dow);
                for (const s of toDelete) {
                    await deleteSchedule(s.id);
                }
                setScheds(s => s.filter(x => x.day_of_week !== dow));
            } else {
                // Create default schedule for this day
                const res = await createSchedule({ institution_id: instId, day_of_week: dow, start_time: '08:00', end_time: '17:00' });
                setScheds(s => [...s, res.data]);
            }
        } catch (e) {
            console.error('Error toggling schedule', e);
        } finally {
            setProcessingDows(prev => { const next = new Set(prev); next.delete(dow); return next; });
        }
    };

    const handleUpdate = async (id: string, start_time: string, end_time: string) => {
        try {
            const res = await updateSchedule(id, { start_time, end_time });
            setScheds(s => s.map(x => x.id === id ? res.data : x));
        } catch (e) {
            console.error('Error updating schedule', e);
        }
    };

    const handleAddBlock = async (dow: number) => {
        setProcessingDows(prev => new Set(prev).add(dow));
        try {
            const res = await createSchedule({ institution_id: instId, day_of_week: dow, start_time: '14:00', end_time: '18:00' });
            setScheds(s => [...s, res.data]);
        } catch (e) {
            console.error('Error adding block', e);
        } finally {
            setProcessingDows(prev => { const next = new Set(prev); next.delete(dow); return next; });
        }
    };

    const handleRemoveBlock = async (id: string) => {
        try {
            await deleteSchedule(id);
            setScheds(s => s.filter(x => x.id !== id));
        } catch (e) {
            console.error('Error removing block', e);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl pb-10">
            <Hdr title="Horarios" sub="Define los días y bloques de horas de atención en tu institución" />

            {loading ? <Spinner /> : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Weekly Summary Bubbles */}
                    <div className="bg-gray-50/50 border-b border-gray-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Clock size={100} /></div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Resumen Semanal</p>
                        <div className="flex items-center gap-2 sm:gap-4 z-10">
                            {DAYS.map((d, i) => {
                                const isActive = scheds.some(s => s.day_of_week === i);
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110' : 'bg-white border border-gray-200 text-gray-400'}`}>
                                            {d.charAt(0)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Day-by-Day Configuration Blocks */}
                    <div className="divide-y divide-gray-100">
                        {DAYS.map((d, i) => {
                            const dayBlocks = scheds.filter(s => s.day_of_week === i).sort((a,b)=>a.start_time.localeCompare(b.start_time));
                            const isActive = dayBlocks.length > 0;
                            const isProcessing = processingDows.has(i);

                            return (
                                <div key={i} className={`p-6 transition-colors ${isActive ? 'bg-white' : 'bg-gray-50/30'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                                        
                                        {/* Left Side: Toggle and Day Name */}
                                        <div className="flex items-center gap-4 w-40 shrink-0 sm:pt-2">
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input type="checkbox" checked={isActive} onChange={() => handleToggle(i, isActive)} disabled={isProcessing} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 border border-gray-200 peer-checked:border-transparent" />
                                            </label>
                                            <span className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{d}</span>
                                            {isProcessing && <Loader2 size={14} className="animate-spin text-blue-500 ml-auto" />}
                                        </div>

                                        {/* Right Side: Time Blocks */}
                                        <div className="flex-1 space-y-3">
                                            {isActive ? (
                                                <>
                                                    {dayBlocks.map((block) => (
                                                        <div key={block.id} className="flex items-center gap-3">
                                                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                                <input 
                                                                    type="time" 
                                                                    defaultValue={block.start_time} 
                                                                    onBlur={(e) => { if(e.target.value !== block.start_time) handleUpdate(block.id, e.target.value, block.end_time); }} 
                                                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-transparent outline-none focus:bg-white transition-colors"
                                                                />
                                                                <span className="text-gray-300 px-2">-</span>
                                                                <input 
                                                                    type="time" 
                                                                    defaultValue={block.end_time} 
                                                                    onBlur={(e) => { if(e.target.value !== block.end_time) handleUpdate(block.id, block.start_time, e.target.value); }} 
                                                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-transparent outline-none focus:bg-white transition-colors"
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => handleRemoveBlock(block.id)} 
                                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Eliminar bloque"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button 
                                                        onClick={() => handleAddBlock(i)} 
                                                        disabled={isProcessing}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mt-2 p-1"
                                                    >
                                                        <Plus size={14} /> Añadir horario
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="sm:pt-2">
                                                    <span className="text-sm font-medium text-gray-400">Cerrado</span>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
