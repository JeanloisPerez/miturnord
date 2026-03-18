import { useState, useEffect } from 'react';
import { Edit2, XCircle, CheckCircle2, Save } from 'lucide-react';
import { getSchedulesByInstitution, createSchedule, updateSchedule, deleteSchedule } from '../../services/api';
import { Hdr, DAYS, ic, btn, Spinner } from './ownerShared';

export default function OwnerSchedulesView({ instId }: { instId: string }) {
    const [scheds, setScheds] = useState<any[]>([]);
    const [form, setForm] = useState({ day_of_week: '1', start_time: '08:00', end_time: '17:00' });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => { getSchedulesByInstitution(instId).then(r => setScheds(r.data)).finally(() => setLoading(false)); }, [instId]);

    const handleEdit = (sch: any) => {
        setForm({ day_of_week: sch.day_of_week.toString(), start_time: sch.start_time, end_time: sch.end_time });
        setEditingId(sch.id); setMsg('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setMsg('');
        try {
            const payload = { day_of_week: Number(form.day_of_week), start_time: form.start_time, end_time: form.end_time };
            if (editingId) {
                const res = await updateSchedule(editingId, payload);
                setScheds(s => s.map(x => x.id === editingId ? res.data : x));
                setMsg('ok');
            } else {
                const res = await createSchedule({ institution_id: instId, ...payload });
                setScheds(s => [...s, res.data]);
                setMsg('ok');
            }
            setEditingId(null);
            setForm({ day_of_week: '1', start_time: '08:00', end_time: '17:00' });
            setTimeout(() => setMsg(''), 4000);
        } catch (err: any) { setMsg('error'); }
    };

    const cancelEdit = () => {
        setEditingId(null); setMsg('');
        setForm({ day_of_week: '1', start_time: '08:00', end_time: '17:00' });
    };

    const handleDel = async (id: string) => { if (!confirm('¿Eliminar?')) return; await deleteSchedule(id); setScheds(s => s.filter(x => x.id !== id)); };

    return (
        <div className="space-y-5 max-w-4xl">
            <Hdr title="Horarios" sub="Define los días y horas de atención por sucursal" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className={`bg-white border rounded-xl p-5 transition-all ${editingId ? 'shadow-md border-blue-200 ring-1 ring-blue-50' : 'border-gray-200 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-800 font-semibold text-sm">{editingId ? 'Editar Horario' : 'Agregar Horario'}</p>
                        {editingId && <button type="button" onClick={cancelEdit} className="text-xs text-blue-600 hover:text-blue-800 transition">Cancelar</button>}
                    </div>
                    <form onSubmit={handleSave} className="space-y-3">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Día</label><select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))} className={ic} disabled={!!editingId}>{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Apertura</label><input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={ic} /></div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Cierre</label><input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={ic} /></div>
                        </div>
                        {msg === 'ok' && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />Guardado.</p>}
                        {msg === 'error' && <p className="text-red-500 text-sm flex items-center gap-1.5"><XCircle size={13} />Error al guardar.</p>}
                        <button type="submit" className={`${btn} w-full flex items-center justify-center gap-2`}><Save size={15} />{editingId ? 'Guardar Cambios' : 'Crear Horario'}</button>
                    </form>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-gray-800 font-semibold text-sm mb-4">Horarios activos</p>
                    {loading ? <Spinner /> : (
                        <div className="space-y-2">
                            {DAYS.map((d, i) => {
                                const sch = scheds.find(s => s.day_of_week === i); return (
                                    <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${sch ? (editingId === sch.id ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-100' : 'border-blue-100 bg-blue-50/50') : 'border-gray-100 bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${sch ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <p className={`text-sm font-semibold ${sch ? 'text-gray-800' : 'text-gray-400'}`}>{d}</p>
                                        </div>
                                        {sch ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-blue-700 font-medium mr-2">{sch.start_time} – {sch.end_time}</span>
                                                <button onClick={() => handleEdit(sch)} className="text-gray-400 hover:text-blue-600 transition p-1"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDel(sch.id)} className="text-red-400 hover:text-red-600 transition p-1"><XCircle size={14} /></button>
                                            </div>
                                        ) : <span className="text-gray-300 text-xs">Cerrado</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
