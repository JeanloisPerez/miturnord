import { useState, useEffect, Suspense, lazy } from 'react';
import { Plus, Edit2, Trash2, Building2, MapPin, EyeOff, Eye, Phone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
    const [expandedMap, setExpandedMap] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { getBranches(instId).then(r => setBranches(r.data)).finally(() => setLoading(false)); }, [instId]);

    const handleEdit = (b: any) => {
        setForm({ name: b.name, city: b.city || '', phone: b.phone || '', is_main: b.is_main });
        setMapLoc(b.latitude && b.longitude ? { lat: b.latitude, lng: b.longitude, address: b.address || '' } : null);
        setEditingId(b.id); setShowForm(true); setError(''); setMsg('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setError('');
        try {
            const payload = { name: form.name, city: form.city || undefined, phone: form.phone || undefined, is_main: form.is_main, address: mapLoc?.address || undefined, latitude: mapLoc?.lat || undefined, longitude: mapLoc?.lng || undefined };
            if (editingId) {
                const res = await updateBranch(editingId, payload);
                setBranches(b => b.map(x => x.id === editingId ? res.data : x)); setMsg('Sucursal actualizada.');
            } else {
                const res = await createBranch({ ...payload, institution_id: instId });
                setBranches(b => [...b, res.data]); setMsg('Sucursal creada.');
            }
            setShowForm(false); setEditingId(null);
            setForm({ name: '', city: '', phone: '', is_main: false }); setMapLoc(null);
            setTimeout(() => setMsg(''), 4000);
        } catch (err: any) { setError(err.response?.data?.message || 'Error'); }
    };

    const cancelForm = () => {
        setShowForm(false); setEditingId(null); setError(''); setMsg('');
        setForm({ name: '', city: '', phone: '', is_main: false }); setMapLoc(null);
    };

    const handleDel = async (id: string) => { if (!confirm('¿Desactivar?')) return; await updateBranch(id, { active: false }); setBranches(b => b.filter(x => x.id !== id)); };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between gap-4">
                <Hdr title="Sucursales" sub="Gestiona las sedes de tu institución" />
                <button onClick={showForm ? cancelForm : () => setShowForm(true)} className={`${btn} flex items-center gap-1.5`}><Plus size={15} />{showForm ? 'Cancelar' : 'Nueva Sucursal'}</button>
            </div>
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all mb-5">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-gray-800 font-semibold text-sm">{editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}</p>
                        <p className="text-gray-400 text-xs mt-0.5">Busca la dirección o haz clic en el mapa</p>
                    </div>
                    <div className="p-5">
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ej: Sucursal Centro" className={ic} /></div>
                                <div><label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Santo Domingo" className={ic} /></div>
                                <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="809-000-0000" className={ic} /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">Ubicación</label>
                                <Suspense fallback={<div className="h-72 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center"><Loader2 size={18} className="text-gray-400 animate-spin" /></div>}>
                                    <MapPicker value={mapLoc} onChange={setMapLoc} height={300} />
                                </Suspense>
                                {mapLoc?.address && <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2"><MapPin size={13} className="text-blue-500 mt-0.5 shrink-0" /><p className="text-xs text-blue-700">{mapLoc.address}</p></div>}
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_main} onChange={e => setForm(f => ({ ...f, is_main: e.target.checked }))} className="rounded border-gray-300 text-blue-600" /><span className="text-sm text-gray-700">Sucursal principal</span></label>
                            {msg && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />{msg}</p>}
                            {error && <p className="text-red-500 text-sm flex items-center gap-1.5"><XCircle size={13} />{error}</p>}
                            <button type="submit" className={btn}>{editingId ? 'Guardar Cambios' : 'Crear Sucursal'}</button>
                        </form>
                    </div>
                </div>
            )}
            <div>
                <p className="text-gray-600 font-semibold text-sm mb-3">Sucursales registradas</p>
                {loading ? <Spinner /> : branches.length === 0 ? <Empty msg="Sin sucursales" /> : (
                    <div className="space-y-3">
                        {branches.map(b => (
                            <div key={b.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-4">
                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Building2 size={16} className="text-blue-600" /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap"><p className="text-gray-900 font-semibold text-sm">{b.name}</p>{b.is_main && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200">Principal</span>}</div>
                                        {b.address && <p className="text-gray-500 text-xs mt-0.5 truncate max-w-lg">{b.address}</p>}
                                        <div className="flex items-center gap-3 mt-0.5">{b.city && <span className="text-gray-400 text-xs flex items-center gap-1"><MapPin size={10} />{b.city}</span>}{b.phone && <span className="text-gray-400 text-xs flex items-center gap-1"><Phone size={10} />{b.phone}</span>}</div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {b.latitude && b.longitude && <button onClick={() => setExpandedMap(expandedMap === b.id ? null : b.id)} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium transition">{expandedMap === b.id ? <EyeOff size={13} /> : <Eye size={13} />}{expandedMap === b.id ? 'Ocultar' : 'Ver mapa'}</button>}
                                        <button onClick={() => handleEdit(b)} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-xs transition"><Edit2 size={13} />Editar</button>
                                        <button onClick={() => handleDel(b.id)} className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs transition"><Trash2 size={13} />Desactivar</button>
                                    </div>
                                </div>
                                {expandedMap === b.id && b.latitude && b.longitude && (
                                    <div className="border-t border-gray-100">
                                        <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 size={16} className="text-gray-400 animate-spin" /></div>}>
                                            <MapPicker value={{ lat: b.latitude, lng: b.longitude, address: b.address ?? '' }} readOnly height={200} />
                                        </Suspense>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
