import { useState, useEffect, Suspense, lazy } from 'react';
import { Plus, Edit2, Trash2, Building2, MapPin, Phone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getBranches, createBranch, updateBranch } from '../../services/api';
import { Hdr, btn, ic, Spinner, Empty } from './ownerShared';
import type { MapLocation } from '../../components/MapPicker';

const MapPicker = lazy(() => import('../../components/MapPicker'));

export default function OwnerBranchesView({ instId }: { instId: string }) {
    const [branches, setBranches] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', city: '', phone: '', is_main: false });
    const [mapLoc, setMapLoc] = useState<MapLocation | null>(null);
    const [msg, setMsg] = useState(''); const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => { getBranches(instId).then(r => setBranches(r.data)).finally(() => setLoading(false)); }, [instId]);
    useEffect(() => { if (branches.length > 0 && !selectedId) setSelectedId(branches[0].id); }, [branches, selectedId]);

    const handleEdit = (b: any) => {
        setForm({ name: b.name, city: b.city || '', phone: b.phone || '', is_main: b.is_main });
        setMapLoc(b.latitude && b.longitude ? { lat: b.latitude, lng: b.longitude, address: b.address || '' } : null);
        setEditingId(b.id); setShowForm(true); setError(''); setMsg('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setError('');
        try {
            const payload = { ...form, address: mapLoc?.address || undefined, latitude: mapLoc?.lat || undefined, longitude: mapLoc?.lng || undefined };
            if (editingId) {
                const res = await updateBranch(editingId, payload);
                setBranches(b => b.map(x => x.id === editingId ? res.data : x)); setMsg('Sucursal actualizada.');
            } else {
                const res = await createBranch({ ...payload, institution_id: instId });
                setBranches(b => [...b, res.data]); setMsg('Sucursal creada.');
                setSelectedId(res.data.id);
            }
            setShowForm(false); setEditingId(null);
            setForm({ name: '', city: '', phone: '', is_main: false }); setMapLoc(null);
            setTimeout(() => setMsg(''), 4000);
        } catch (err: any) { setError('Error al guardar'); }
    };

    const cancelForm = () => {
        setShowForm(false); setEditingId(null); setError(''); setMsg('');
        setForm({ name: '', city: '', phone: '', is_main: false }); setMapLoc(null);
    };

    const handleDel = async (id: string) => { if (!confirm('¿Desactivar?')) return; await updateBranch(id, { active: false }); setBranches(b => b.filter(x => x.id !== id)); if(selectedId === id) setSelectedId(null); };

    const selBranch = branches.find(b => b.id === selectedId);

    return (
        <div className="space-y-6 max-w-6xl pb-10">
            <div className="flex items-center justify-between gap-4">
                <Hdr title="Sucursales" sub="Gestiona las sedes de tu institución" />
                <button onClick={showForm ? cancelForm : () => { setShowForm(true); setEditingId(null); setForm({ name: '', city: '', phone: '', is_main: false }); setMapLoc(null); }} className={`${btn} flex items-center gap-1.5`}><Plus size={15} />{showForm ? 'Cancelar' : 'Nueva Sucursal'}</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="col-span-1 space-y-3">
                    {loading ? <Spinner /> : branches.length === 0 ? <Empty msg="Sin sucursales" /> : (
                        branches.map(b => (
                            <div key={b.id} onClick={() => { setSelectedId(b.id); setShowForm(false); }} className={`bg-white border text-left rounded-2xl p-4 cursor-pointer transition-all ${selectedId === b.id && !showForm ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-gray-200 shadow-sm hover:border-blue-200 hover:shadow'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-gray-900 font-bold text-sm truncate pr-2">{b.name}</p>
                                    <span className="shrink-0 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded border border-green-200">Activa</span>
                                </div>
                                <p className="text-gray-500 text-xs flex items-start gap-1.5 mb-1.5"><MapPin size={14} className="shrink-0 text-gray-400" /><span className="line-clamp-2">{b.address || b.city || 'Sin dirección'}</span></p>
                                {b.phone && <p className="text-gray-500 text-xs flex items-center gap-1.5"><Phone size={14} className="text-gray-400" />{b.phone}</p>}
                                
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-gray-400 text-xs font-medium">Actividad reciente</p>
                                    <p className="text-blue-600 font-bold text-xs">-- citas este mes</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="col-span-1 lg:col-span-2">
                    {showForm ? (
                        <div className="bg-white border text-left border-gray-200 rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-right-4">
                            <p className="text-gray-900 font-bold text-lg mb-1">{editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}</p>
                            <p className="text-gray-500 text-sm mb-6">Completa los datos de la ubicación</p>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ej: Sucursal Centro" className={ic} /></div>
                                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="809-000-0000" className={ic} /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-2">Ubicación</label>
                                    <Suspense fallback={<div className="h-72 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center"><Loader2 size={18} className="text-gray-400 animate-spin" /></div>}>
                                        <MapPicker value={mapLoc} onChange={setMapLoc} height={300} />
                                    </Suspense>
                                    {mapLoc?.address && <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2"><MapPin size={13} className="text-blue-500 mt-0.5 shrink-0" /><p className="text-xs text-blue-700">{mapLoc.address}</p></div>}
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer pb-2"><input type="checkbox" checked={form.is_main} onChange={e => setForm(f => ({ ...f, is_main: e.target.checked }))} className="rounded border-gray-300 text-blue-600" /><span className="text-sm text-gray-700">Sucursal principal</span></label>
                                {msg && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />{msg}</p>}
                                {error && <p className="text-red-500 text-sm flex items-center gap-1.5"><XCircle size={13} />{error}</p>}
                                <button type="submit" className={btn}>{editingId ? 'Guardar Cambios' : 'Crear Sucursal'}</button>
                            </form>
                        </div>
                    ) : selBranch ? (
                        <div className="bg-white border text-left border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
                            <div className="h-64 bg-slate-100 border-b border-gray-100 relative">
                                {selBranch.latitude && selBranch.longitude ? (
                                    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 size={24} className="text-blue-600 animate-spin" /></div>}>
                                        <MapPicker value={{ lat: selBranch.latitude, lng: selBranch.longitude, address: selBranch.address ?? '' }} readOnly height={256} />
                                    </Suspense>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <MapPin size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm">Sin ubicación en el mapa</p>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => handleEdit(selBranch)} className="bg-white text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-lg text-sm font-semibold shadow border border-gray-200 transition flex items-center gap-2"><Edit2 size={14}/>Editar</button>
                                    <button onClick={() => handleDel(selBranch.id)} className="bg-white text-gray-700 hover:text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold shadow border border-gray-200 transition flex items-center gap-2"><Trash2 size={14}/>Eliminar</button>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-900 font-bold text-xl mb-6">Detalles de la Sucursal</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Dirección</p>
                                        <p className="text-gray-800 text-sm font-medium leading-relaxed">{selBranch.address || selBranch.city || 'No especificada'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Teléfono</p>
                                        <p className="text-gray-800 text-sm font-medium leading-relaxed">{selBranch.phone || 'No especificado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Horario de Atención</p>
                                        <p className="text-gray-800 text-sm font-medium leading-relaxed">Lun - Vie • 08:00 - 18:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10">
                            <Building2 size={40} className="mb-4 text-gray-300" />
                            <p className="text-sm font-medium">Selecciona una sucursal para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
