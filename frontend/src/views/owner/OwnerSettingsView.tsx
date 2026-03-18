import { useState, useEffect } from 'react';
import { Globe, Save, Loader2, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { getBusinessRules, updateBusinessRules, getInstitution, updateInstitution } from '../../services/api';
import { Hdr, btn, ic, Spinner, ImageUploader } from './ownerShared';

export default function OwnerSettingsView({ instId }: { instId: string }) {
    const [rules, setRules] = useState<any>({ auto_confirm: true, buffer_minutes: 0, max_per_slot: 1, no_show_minutes: 30, advance_book_days: 30 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [profile, setProfile] = useState({ description: '', phone: '', email: '', logo_url: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);

    useEffect(() => {
        getBusinessRules(instId).then(r => setRules(r.data)).finally(() => setLoading(false));
        getInstitution(instId).then(r => {
            const d = r.data;
            setProfile({ description: d.description || '', phone: d.phone || '', email: d.email || '', logo_url: d.logo_url || '' });
        });
    }, [instId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setMsg('');
        try {
            const res = await updateBusinessRules(instId, rules);
            setRules(res.data); setMsg('ok');
        } catch { setMsg('error'); }
        finally { setSaving(false); setTimeout(() => setMsg(''), 4000); }
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault(); setProfileSaving(true); setProfileMsg('');
        try {
            await updateInstitution(instId, { description: profile.description || undefined, phone: profile.phone || undefined, email: profile.email || undefined, logo_url: profile.logo_url || undefined });
            setProfileMsg('ok');
        } catch { setProfileMsg('error'); }
        finally { setProfileSaving(false); setTimeout(() => setProfileMsg(''), 4000); }
    };

    if (loading) return <Spinner />;

    const fields = [
        { key: 'buffer_minutes', label: 'Buffer entre citas', unit: 'min', desc: 'Tiempo de descanso entre citas.', min: 0, max: 120 },
        { key: 'max_per_slot', label: 'Citas simultáneas máx.', unit: 'citas', desc: 'Cuántas citas al mismo tiempo.', min: 1, max: 50 },
        { key: 'no_show_minutes', label: 'Espera para NO_SHOW', unit: 'min', desc: 'Minutos antes de marcar como no presentado.', min: 5, max: 120 },
        { key: 'advance_book_days', label: 'Días de anticipación', unit: 'días', desc: 'Con cuántos días se puede agendar.', min: 1, max: 365 }
    ];

    return (
        <div className="space-y-6 max-w-2xl">
            <Hdr title="Configuración" sub="Perfil de empresa y reglas del motor de citas" />

            {/* Institution Profile Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Globe size={15} className="text-blue-600" />
                    <p className="text-gray-800 font-semibold text-sm">Perfil de la Empresa</p>
                </div>
                <form onSubmit={handleProfileSave} className="p-6 space-y-5">
                    <ImageUploader
                        label="Logo / Imagen de portada"
                        value={profile.logo_url}
                        onChange={url => setProfile(p => ({ ...p, logo_url: url }))}
                    />
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                        <textarea
                            value={profile.description}
                            onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
                            rows={3} placeholder="Describe tu institución..."
                            className={`${ic} resize-none`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label><input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="809-000-0000" className={ic} /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="contacto@empresa.com" className={ic} /></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="submit" disabled={profileSaving} className={`${btn} flex items-center gap-2`}>
                            {profileSaving ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : <><Save size={14} />Guardar perfil</>}
                        </button>
                        {profileMsg === 'ok' && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />Guardado.</p>}
                        {profileMsg === 'error' && <p className="text-red-500 text-sm flex items-center gap-1.5"><XCircle size={13} />Error al guardar.</p>}
                    </div>
                </form>
            </div>

            {/* Business Rules Card */}
            <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Settings size={15} className="text-blue-600" />
                    <p className="text-gray-800 font-semibold text-sm">Reglas del Motor de Citas</p>
                </div>
                <div className="flex items-start justify-between gap-4 p-6">
                    <div>
                        <p className="text-gray-800 font-semibold text-sm">Confirmación automática</p>
                        <p className="text-gray-500 text-xs mt-0.5">Las citas se confirman al instante sin intervención manual.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" checked={rules.auto_confirm} onChange={e => setRules((r: any) => ({ ...r, auto_confirm: e.target.checked }))} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                </div>
                {fields.map(({ key, label, unit, desc, min, max }) => (
                    <div key={key} className="p-6">
                        <p className="text-gray-800 font-semibold text-sm">{label}</p>
                        <p className="text-gray-500 text-xs mt-0.5 mb-3">{desc}</p>
                        <div className="flex items-center gap-3">
                            <input type="number" min={min} max={max} value={rules[key]} onChange={e => setRules((r: any) => ({ ...r, [key]: Number(e.target.value) }))} className={`${ic} w-28`} />
                            <span className="text-gray-500 text-sm">{unit}</span>
                        </div>
                    </div>
                ))}
                <div className="p-6 flex items-center gap-4">
                    <button type="submit" disabled={saving} className={`${btn} flex items-center gap-2`}>
                        {saving ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : <>Guardar Configuración</>}
                    </button>
                    {msg === 'ok' && <p className="text-green-600 text-sm flex items-center gap-1.5"><CheckCircle2 size={13} />Guardado correctamente.</p>}
                    {msg === 'error' && <p className="text-red-500 text-sm flex items-center gap-1.5"><XCircle size={13} />Error al guardar.</p>}
                </div>
            </form>
        </div>
    );
}
