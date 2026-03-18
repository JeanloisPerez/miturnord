import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, ListTodo } from 'lucide-react';
import { getCustomFields, createCustomField, updateCustomField, deleteCustomField, getServicesByInstitution } from '../../services/api';
import { Hdr, btn, ic, Spinner, Empty } from './ownerShared';

export default function OwnerCustomFieldsView({ instId }: { instId: string }) {
    const [fields, setFields] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [msg, setMsg] = useState('');

    const [form, setForm] = useState({
        label: '', field_type: 'TEXT', placeholder: '', required: false, options: '', service_id: '', order: 0
    });

    useEffect(() => {
        Promise.all([
            getCustomFields(instId).then(r => setFields(r.data)),
            getServicesByInstitution(instId).then(r => setServices(r.data))
        ]).finally(() => setLoading(false));
    }, [instId]);

    const handleEdit = (f: any) => {
        setForm({
            label: f.label, field_type: f.field_type, placeholder: f.placeholder || '',
            required: f.required, options: f.options || '', service_id: f.service_id || '', order: f.order
        });
        setEditingId(f.id); setShowForm(true); setMsg('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setMsg('');
        try {
            const payload = { ...form, service_id: form.service_id || undefined, order: Number(form.order) };
            if (editingId) {
                const res = await updateCustomField(editingId, payload);
                setFields(list => list.map(x => x.id === editingId ? res.data : x).sort((a, b) => a.order - b.order));
            } else {
                const res = await createCustomField(payload);
                setFields(list => [...list, res.data].sort((a, b) => a.order - b.order));
            }
            setShowForm(false); setEditingId(null); setMsg('ok'); setTimeout(() => setMsg(''), 3000);
            setForm({ label: '', field_type: 'TEXT', placeholder: '', required: false, options: '', service_id: '', order: 0 });
        } catch { setMsg('error'); }
    };

    const handleDel = async (id: string) => {
        if (!confirm('¿Eliminar campo?')) return;
        try { await deleteCustomField(id); setFields(list => list.filter(x => x.id !== id)); } catch { alert('Error al eliminar'); }
    };

    const cancelForm = () => {
        setShowForm(false); setEditingId(null); setMsg('');
        setForm({ label: '', field_type: 'TEXT', placeholder: '', required: false, options: '', service_id: '', order: 0 });
    };

    return (
        <div className="space-y-5 max-w-5xl">
            <div className="flex items-center justify-between gap-4">
                <Hdr title="Formularios Dinámicos" sub="Campos requeridos a los clientes al agendar" />
                <button onClick={showForm ? cancelForm : () => setShowForm(true)} className={`${btn} flex items-center gap-1.5`}><Plus size={15} />{showForm ? 'Cancelar' : 'Nuevo Campo'}</button>
            </div>

            {showForm && (
                <div className="bg-white border md:col-span-2 border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                    <p className="text-gray-800 font-semibold mb-4">{editingId ? 'Editar Campo' : 'Nuevo Campo'}</p>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre (Pregunta) *</label><input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} required placeholder="Ej: Motivo de la visita" className={ic} /></div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Campo *</label>
                            <select value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value }))} className={ic}>
                                <option value="TEXT">Texto Corto</option>
                                <option value="NUMBER">Número</option>
                                <option value="EMAIL">Correo Electrónico</option>
                                <option value="PHONE">Teléfono</option>
                                <option value="DATE">Fecha</option>
                                <option value="SELECT">Selección Múltiple (Lista)</option>
                                <option value="FILE">Documento (Archivo/Imagen)</option>
                            </select>
                        </div>

                        {form.field_type === 'SELECT' && <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Opciones (separadas por coma)</label><input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Ej: Opción 1, Opción 2, Opción 3" className={ic} /></div>}

                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Texto de ayuda (Placeholder)</label><input value={form.placeholder} onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))} placeholder="Ej: Escriba su motivo aquí" className={ic} /></div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Aplica exclusivamente al servicio (Opcional)</label>
                            <select value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))} className={ic}>
                                <option value="">Aplica Globalmente a Todos</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.required} onChange={e => setForm(f => ({ ...f, required: e.target.checked }))} className="rounded border-gray-300 text-blue-600" /><span className="text-sm text-gray-700">Obligatorio</span></label>
                        </div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Orden de aparición (Número)</label><input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={ic} /></div>

                        <div className="md:col-span-2 pt-2 flex items-center gap-4">
                            <button type="submit" className={btn}>{editingId ? 'Guardar Cambios' : 'Crear Campo'}</button>
                            {msg === 'error' && <span className="text-red-500 text-sm">Error al guardar. Verifica los datos.</span>}
                        </div>
                    </form>
                </div>
            )}

            {msg === 'ok' && !showForm && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 flex items-center gap-2"><CheckCircle2 size={16} />Guardado correctamente.</div>}

            {loading ? <Spinner /> : fields.length === 0 ? <Empty msg="No hay campos personalizados." /> : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span className="col-span-4">Nombre (Pregunta)</span>
                        <span className="col-span-2">Tipo</span>
                        <span className="col-span-2">Obligatorio</span>
                        <span className="col-span-2">Servicio</span>
                        <span className="col-span-2 text-right">Acciones</span>
                    </div>
                    {fields.map(f => {
                        const svc = services.find(s => s.id === f.service_id);
                        return (
                            <div key={f.id} className="grid grid-cols-12 items-center px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition text-sm">
                                <span className="col-span-4 font-medium text-gray-900 flex items-center gap-2"><ListTodo size={14} className="text-gray-400" /> {f.label}</span>
                                <span className="col-span-2 text-gray-500 text-xs bg-gray-100 inline-block px-2 py-0.5 rounded w-max">{f.field_type}</span>
                                <span className={`col-span-2 text-xs font-medium ${f.required ? 'text-blue-600' : 'text-gray-400'}`}>{f.required ? 'Sí' : 'No'}</span>
                                <span className="col-span-2 text-gray-500 text-xs truncate">{svc ? svc.name : 'Global'}</span>
                                <div className="col-span-2 flex justify-end gap-3 text-gray-400">
                                    <button onClick={() => handleEdit(f)} className="hover:text-blue-600 transition p-1"><Edit2 size={15} /></button>
                                    <button onClick={() => handleDel(f.id)} className="hover:text-red-600 transition p-1"><Trash2 size={15} /></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
