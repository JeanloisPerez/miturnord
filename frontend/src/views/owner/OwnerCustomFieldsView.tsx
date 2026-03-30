import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, GripVertical, UploadCloud } from 'lucide-react';
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
        <div className="space-y-6 max-w-6xl pb-10">
            <Hdr title="Formularios Dinámicos" sub="Campos requeridos a los clientes al agendar una cita" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
                {/* Lado Izquierdo: Constructor */}
                <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Configuración de Campos</h2>
                        <button onClick={showForm ? cancelForm : () => setShowForm(true)} className={`${btn} flex items-center gap-1.5`}>
                            <Plus size={15} />{showForm ? 'Cancelar' : 'Nuevo Campo'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <p className="text-gray-900 font-bold mb-5 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">🛠</span>
                                {editingId ? 'Editar Campo' : 'Nuevo Campo'}
                            </p>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre (Pregunta) *</label>
                                    <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} required placeholder="Ej: Motivo de la visita" className={ic} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de Campo *</label>
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
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aplica al servicio (Opcional)</label>
                                        <select value={form.service_id} onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))} className={ic}>
                                            <option value="">Global (Todos)</option>
                                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {form.field_type === 'SELECT' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Opciones (separadas por coma)</label>
                                        <input value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Ej: Opción 1, Opción 2, Opción 3" className={ic} />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Texto de ayuda (Placeholder)</label>
                                    <input value={form.placeholder} onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))} placeholder="Ej: Escriba su motivo aquí" className={ic} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-center pt-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Orden</label>
                                        <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={ic} />
                                    </div>
                                    <div className="flex items-center pt-5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <div className={`w-10 h-6 flex items-center bg-gray-200 rounded-full p-1 transition-colors ${form.required ? 'bg-blue-600' : ''}`} onClick={() => setForm(f => ({ ...f, required: !f.required }))}>
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${form.required ? 'translate-x-4' : ''}`} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-800">Obligatorio</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-gray-100 mt-2">
                                    {msg === 'error' ? <span className="text-red-500 text-xs font-medium">Error al guardar. Verifica los datos.</span> : <span />}
                                    <button type="submit" className={btn}>{editingId ? 'Guardar Cambios' : 'Crear Campo'}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {msg === 'ok' && !showForm && <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-200 flex items-center gap-2 font-medium"><CheckCircle2 size={16} />Campo guardado correctamente.</div>}

                    {loading ? <Spinner /> : fields.length === 0 ? <Empty msg="Aún no has creado campos personalizados para tus clientes." /> : (
                        <div className="space-y-3">
                            {fields.map(f => (
                                <div key={f.id} className="bg-white border text-left border-gray-200 rounded-2xl p-4 flex gap-3 hover:border-blue-300 transition-all cursor-move shadow-sm group">
                                    <div className="text-gray-300 group-hover:text-blue-400 mt-1 cursor-grab"><GripVertical size={16}/></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-bold text-sm text-gray-900 truncate pr-2">{f.label}</p>
                                            {f.required && <span className="shrink-0 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-md">Requerido</span>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md">{f.field_type}</span>
                                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                {f.service_id ? services.find(s=>s.id===f.service_id)?.name : 'Aplica a todos'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-2 shrink-0 border-l border-gray-100 pl-3 ml-2">
                                        <button onClick={() => handleEdit(f)} title="Editar"><Edit2 size={15} className="text-gray-400 hover:text-blue-600 transition"/></button>
                                        <button onClick={() => handleDel(f.id)} title="Eliminar"><Trash2 size={15} className="text-gray-400 hover:text-red-500 transition"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lado Derecho: Preview */}
                <div className="sticky top-20">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 py-1 px-3 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl border-b border-l border-blue-200">
                            Vista Previa
                        </div>
                        
                        <p className="font-bold text-lg text-gray-900 mb-1 mt-1">Formulario del Cliente</p>
                        <p className="text-sm font-medium text-gray-500 mb-6">Así es como tus clientes verán las preguntas al agendar.</p>
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                            {fields.length === 0 ? <p className="text-center text-sm font-medium text-gray-400 py-6 border-2 border-dashed border-gray-100 rounded-xl">Agrega campos a la izquierda para previsualizarlos aquí</p> : null}
                            {fields.map(f => (
                                <div key={f.id} className="relative group/preview">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                                    {f.field_type === 'TEXT' && <input readOnly placeholder={f.placeholder || 'Respuesta de texto...'} className="w-full text-sm font-medium border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none text-gray-600 pointer-events-none" />}
                                    {f.field_type === 'NUMBER' && <input readOnly placeholder={f.placeholder || '123...'} className="w-full text-sm font-medium border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none text-gray-600 pointer-events-none" />}
                                    {f.field_type === 'EMAIL' && <input readOnly placeholder={f.placeholder || 'correo@ejemplo.com'} className="w-full text-sm font-medium border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none text-gray-600 pointer-events-none" />}
                                    {f.field_type === 'PHONE' && <input readOnly placeholder={f.placeholder || '(800) 000-0000'} className="w-full text-sm font-medium border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none text-gray-600 pointer-events-none" />}
                                    {f.field_type === 'DATE' && <input readOnly type="date" className="w-full text-sm font-medium border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 outline-none text-gray-400 pointer-events-none" />}
                                    {f.field_type === 'SELECT' && <div className="w-full text-sm font-medium border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-gray-400">{f.placeholder || 'Seleccionar opción'} <span className="float-right text-[10px]">▼</span></div>}
                                    {f.field_type === 'FILE' && (
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                            <UploadCloud size={24} className="mb-2 text-indigo-300"/> 
                                            <span className="text-sm font-bold text-gray-500">Haz clic o arrastra un archivo aquí</span>
                                            <span className="text-xs font-medium text-gray-400 mt-1">PNG, JPG o PDF</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            <div className="pt-6 border-t border-gray-100 mt-6">
                                <button className="w-full bg-gray-900 text-white font-bold text-sm rounded-xl py-4 opacity-50 cursor-not-allowed">Completar Reserva</button>
                                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-3">Simulación - Botón desactivado</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
