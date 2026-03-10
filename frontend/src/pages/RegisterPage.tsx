import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, getInstitutionTypes } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = [
    { value: 'CLIENT', label: 'Cliente', desc: 'Agenda citas en instituciones' },
    { value: 'INSTITUTION_OWNER', label: 'Propietario', desc: 'Registra y gestiona tu institución' },
];

export default function RegisterPage() {
    const [form, setForm] = useState({
        full_name: '', email: '', password: '', role: 'CLIENT',
        institution_name: '', institution_type_id: '',
        institution_description: '', institution_address: '', institution_phone: '',
    });
    const [types, setTypes] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { getInstitutionTypes().then(r => setTypes(r.data)).catch(() => { }); }, []);

    const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const payload: any = { full_name: form.full_name, email: form.email, password: form.password, role: form.role };
            if (form.role === 'INSTITUTION_OWNER') {
                Object.assign(payload, {
                    institution_name: form.institution_name,
                    institution_type_id: form.institution_type_id,
                    institution_description: form.institution_description,
                    institution_address: form.institution_address,
                    institution_phone: form.institution_phone,
                });
            }
            const res = await registerUser(payload);
            login(res.data.access_token);
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.message;
            setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al registrarse');
        } finally { setLoading(false); }
    };

    const selectedType = types.find(t => t.id === form.institution_type_id);

    const inputClass = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                {/* Brand */}
                <div className="mb-8">
                    <span className="text-blue-600 text-sm font-semibold tracking-wide uppercase">MiTurnoRD</span>
                    <h1 className="text-2xl font-semibold text-gray-900 mt-1">Crear cuenta</h1>
                    <p className="text-gray-500 text-sm mt-1">Completa la información para registrarte</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de cuenta</label>
                        <div className="grid grid-cols-2 gap-3">
                            {ROLES.map(r => (
                                <button type="button" key={r.value} id={`role-${r.value}`} onClick={() => update('role', r.value)}
                                    className={`rounded-lg p-3 text-left border transition-all ${form.role === r.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                    <div className={`font-medium text-sm ${form.role === r.value ? 'text-blue-700' : 'text-gray-800'}`}>{r.label}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Common fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                        <input id="reg-name" type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} required placeholder="Juan Pérez" className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                        <input id="reg-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="correo@ejemplo.com" className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                        <input id="reg-password" type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" className={inputClass} />
                    </div>

                    {/* Institution fields */}
                    {form.role === 'INSTITUTION_OWNER' && (
                        <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-700">Datos de la Institución</p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la institución</label>
                                <input id="reg-institution-name" type="text" value={form.institution_name} onChange={e => update('institution_name', e.target.value)} required placeholder="Clínica Santa María" className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de institución</label>
                                <select id="reg-institution-type" value={form.institution_type_id} onChange={e => update('institution_type_id', e.target.value)} required
                                    className={inputClass + ' bg-white'}>
                                    <option value="">Selecciona un tipo</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                {selectedType && (
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Campos: {selectedType.fields?.filter((f: any) => f.required).map((f: any) => f.label).join(', ')}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección <span className="text-gray-400 font-normal">(opcional)</span></label>
                                <input type="text" value={form.institution_address} onChange={e => update('institution_address', e.target.value)} placeholder="Av. 27 de Febrero, Santo Domingo" className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
                                <input type="text" value={form.institution_phone} onChange={e => update('institution_phone', e.target.value)} placeholder="809-000-0000" className={inputClass} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                                <textarea value={form.institution_description} onChange={e => update('institution_description', e.target.value)} rows={2} placeholder="Breve descripción..."
                                    className={inputClass + ' resize-none'} />
                            </div>
                        </div>
                    )}

                    {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>}

                    <button id="reg-submit" type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition">
                        {loading ? 'Registrando...' : 'Crear cuenta'}
                    </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}
