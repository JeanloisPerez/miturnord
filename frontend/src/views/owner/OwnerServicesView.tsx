import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Clock, Wrench, ToggleRight, ToggleLeft, CheckCircle2, Building2, X, Check, MapPin } from 'lucide-react';
import { getServicesByInstitution, createService, updateService, deleteService, getBranches, getServiceBranchAssignments, assignServiceToBranch, removeServiceFromBranch } from '../../services/api';
import { Spinner, Empty, Hdr, btn, ic, ImageUploader } from './ownerShared';

// ── Branch Assignment Modal ──────────────────────────────────────────────────
function BranchAssignModal({
    service, instId, onClose
}: { service: any; instId: string; onClose: () => void }) {
    const [branches, setBranches] = useState<any[]>([]);
    const [assigned, setAssigned] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            getBranches(instId),
            getServiceBranchAssignments(service.id),
        ]).then(([bRes, aRes]) => {
            setBranches(bRes.data || []);
            const activeIds = new Set<string>(
                (aRes.data || []).filter((a: any) => a.active).map((a: any) => a.branch.id)
            );
            setAssigned(activeIds);
        }).finally(() => setLoading(false));
    }, [service.id, instId]);

    const toggle = async (branchId: string) => {
        setSaving(branchId);
        try {
            if (assigned.has(branchId)) {
                await removeServiceFromBranch(service.id, branchId);
                setAssigned(prev => { const s = new Set(prev); s.delete(branchId); return s; });
            } else {
                await assignServiceToBranch(service.id, branchId);
                setAssigned(prev => new Set([...prev, branchId]));
            }
        } catch { } finally { setSaving(null); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <p className="font-bold text-gray-900 text-base">Sucursales — {service.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Activa las sucursales donde se ofrece este servicio</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8"><Spinner /></div>
                    ) : branches.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">No hay sucursales creadas aún</p>
                    ) : branches.map(b => {
                        const isActive = assigned.has(b.id);
                        const isSaving = saving === b.id;
                        return (
                            <button
                                key={b.id}
                                onClick={() => toggle(b.id)}
                                disabled={isSaving}
                                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                                    ${isActive
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    } ${isSaving ? 'opacity-60' : ''}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                    ${isActive ? 'bg-blue-500' : 'bg-gray-100'}`}>
                                    {isActive
                                        ? <Check size={14} className="text-white" />
                                        : <Building2 size={14} className="text-gray-500" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                                        {b.name}
                                        {b.is_main && <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-md font-medium">Principal</span>}
                                    </p>
                                    {b.address && (
                                        <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                                            <MapPin size={10} />{b.address}{b.city ? `, ${b.city}` : ''}
                                        </p>
                                    )}
                                </div>
                                <span className={`text-xs font-semibold shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-300'}`}>
                                    {isSaving ? '...' : isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                        {assigned.size} de {branches.length} sucursal(es) activa(s)
                    </p>
                    <button onClick={onClose} className={btn}>Listo</button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function OwnerServicesView({ instId }: { instId: string }) {
    const [svcs, setSvcs] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', duration: '30', price: '', description: '', image_url: '' });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [assignModal, setAssignModal] = useState<any | null>(null);

    const loadServices = useCallback(() => {
        setLoading(true);
        getServicesByInstitution(instId).then(r => setSvcs(r.data)).finally(() => setLoading(false));
    }, [instId]);

    useEffect(() => { loadServices(); }, [loadServices]);

    const handleEdit = (s: any) => {
        setForm({ name: s.name, duration: s.duration?.toString() || '30', price: s.price ? s.price.toString() : '', description: s.description || '', image_url: s.image_url || '' });
        setEditingId(s.id); setShowForm(true); setMsg('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setMsg('');
        try {
            const payload = { name: form.name, description: form.description, duration: Number(form.duration), price: form.price ? Number(form.price) : undefined, image_url: form.image_url || undefined };
            if (editingId) {
                const res = await updateService(editingId, payload);
                setSvcs(s => s.map(x => x.id === editingId ? res.data : x));
                setMsg('ok');
            } else {
                const res = await createService({ ...payload, institution_id: instId, is_active: true });
                setSvcs(s => [...s, res.data]); setMsg('ok');
            }
            setShowForm(false); setEditingId(null);
            setForm({ name: '', duration: '30', price: '', description: '', image_url: '' });
        } catch { setMsg('error'); }
    };

    const cancelForm = () => {
        setShowForm(false); setEditingId(null); setMsg('');
        setForm({ name: '', duration: '30', price: '', description: '', image_url: '' });
    };

    const toggleActive = async (id: string, is_active: boolean) => { await updateService(id, { is_active }); setSvcs(s => s.map(x => x.id === id ? { ...x, is_active } : x)); };
    const handleDel = async (id: string) => { if (!confirm('¿Eliminar?')) return; await deleteService(id); setSvcs(s => s.filter(x => x.id !== id)); };
    const topId = svcs.reduce((top, s, _, arr) => arr.find(x => x.id === top)?.appointmentCount > s.appointmentCount ? top : s.id, svcs[0]?.id);

    return (
        <div className="space-y-5 max-w-5xl">
            {assignModal && (
                <BranchAssignModal
                    service={assignModal}
                    instId={instId}
                    onClose={() => setAssignModal(null)}
                />
            )}

            <div className="flex items-center justify-between gap-4">
                <Hdr title="Servicios" sub="Administra los servicios que ofreces" />
                <button onClick={showForm ? cancelForm : () => setShowForm(true)} className={`${btn} flex items-center gap-1.5`}><Plus size={15} />{showForm ? 'Cancelar' : 'Nuevo Servicio'}</button>
            </div>
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm transition-all text-sm">
                    <p className="text-gray-800 font-semibold mb-4">{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</p>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ej: Consulta General" className={ic} /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Duración (min) *</label><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} required min="5" className={ic} /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Precio RD$</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" className={ic} /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción breve" className={ic} /></div>
                        <div className="col-span-2">
                            <ImageUploader label="Imagen del servicio" value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
                        </div>
                        {msg === 'ok' && <p className="col-span-2 text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />Guardado.</p>}
                        {msg === 'error' && <p className="col-span-2 text-red-500 text-sm">Error al guardar.</p>}
                        <button type="submit" className={`${btn} col-span-2`}>{editingId ? 'Guardar Cambios' : 'Crear Servicio'}</button>
                    </form>
                </div>
            )}
            {loading ? <Spinner /> : svcs.length === 0 ? <Empty msg="Sin servicios aún" /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {svcs.map(s => (
                        <div key={s.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${s.is_active !== false ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                            {s.image_url && (
                                <div className="h-32 w-full overflow-hidden">
                                    <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    {!s.image_url && <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Wrench size={16} className="text-blue-600" /></div>}
                                    <div className="flex items-center gap-2 ml-auto">
                                        {s.id === topId && svcs.length > 1 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 font-medium">Popular</span>}
                                        <button onClick={() => toggleActive(s.id, !(s.is_active !== false))} className="text-gray-400 hover:text-blue-500 transition">{s.is_active !== false ? <ToggleRight size={20} className="text-blue-500" /> : <ToggleLeft size={20} />}</button>
                                    </div>
                                </div>
                                <p className="text-gray-900 font-bold text-base">{s.name}</p>
                                {s.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{s.description}</p>}
                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                                    <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{s.duration} min</span>
                                    {s.price && <span className="text-blue-700 text-sm font-bold">RD${Number(s.price).toFixed(0)}</span>}
                                    <div className="ml-auto flex items-center gap-2">
                                        {/* Branch assignment button */}
                                        <button
                                            onClick={() => setAssignModal(s)}
                                            title="Asignar sucursales"
                                            className="text-gray-400 hover:text-indigo-600 transition"
                                        >
                                            <Building2 size={14} />
                                        </button>
                                        <button onClick={() => handleEdit(s)} className="text-gray-400 hover:text-blue-600 transition"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDel(s.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
