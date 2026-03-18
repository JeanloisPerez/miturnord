import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { getMe, updateMe, changePassword } from '../../services/api';
import { inputCls } from './clientShared';

export default function ClientProfileView({ onLogout }: { onLogout: () => void }) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameMsg, setNameMsg] = useState('');

    const [curPwd, setCurPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [savingPwd, setSavingPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState('');
    const [pwdError, setPwdError] = useState('');

    useEffect(() => {
        getMe().then(r => {
            setProfile(r.data);
            setName(r.data.name || '');
        }).finally(() => setLoading(false));
    }, []);

    const handleNameSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingName(true); setNameMsg('');
        try {
            await updateMe({ name });
            setNameMsg('ok');
        } catch {
            setNameMsg('error');
        } finally {
            setSavingName(false);
            setTimeout(() => setNameMsg(''), 4000);
        }
    };

    const handlePwdSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) { setPwdError('Las contraseñas no coinciden'); return; }
        setSavingPwd(true); setPwdMsg(''); setPwdError('');
        try {
            await changePassword({ current_password: curPwd, new_password: newPwd });
            setPwdMsg('ok');
            setCurPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch (err: any) {
            setPwdError(err.response?.data?.message || 'Error al cambiar contraseña');
        } finally {
            setSavingPwd(false);
            setTimeout(() => setPwdMsg(''), 4000);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Mi Perfil</h1>
                <p className="text-gray-500 text-sm mt-1">Gestiona tu información personal y credenciales</p>
            </div>

            {/* Basic Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Información Personal</h2>
                <form onSubmit={handleNameSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico</label>
                        <input value={profile?.email || ''} disabled className={`${inputCls} bg-gray-50 text-gray-500`} />
                        <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo</label>
                        <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                        <button type="submit" disabled={savingName || name === profile?.name}
                            className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition flex items-center gap-2">
                            {savingName ? <Loader2 size={13} className="animate-spin" /> : null} Guardar cambios
                        </button>
                        {nameMsg === 'ok' && <span className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle size={13} />Actualizado</span>}
                    </div>
                </form>
            </div>

            {/* Password */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Cambiar Contraseña</h2>
                <form onSubmit={handlePwdSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña actual</label>
                        <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} required className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
                        <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required className={inputCls} minLength={6} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar nueva contraseña</label>
                        <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required className={inputCls} />
                    </div>
                    {pwdError && <p className="text-red-500 text-sm flex items-center gap-1.5"><AlertCircle size={13} />{pwdError}</p>}
                    <div className="flex items-center gap-3 pt-1">
                        <button type="submit" disabled={savingPwd}
                            className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition flex items-center gap-2">
                            {savingPwd ? <><Loader2 size={13} className="animate-spin" />Guardando...</> : 'Cambiar contraseña'}
                        </button>
                        {pwdMsg === 'ok' && <span className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle size={13} />¡Contraseña actualizada!</span>}
                    </div>
                </form>
            </div>

            {/* Danger zone */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-red-700 mb-3">Sesión</p>
                <button onClick={onLogout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition">
                    <LogOut size={15} /> Cerrar sesión
                </button>
            </div>
        </div>
    );
}
