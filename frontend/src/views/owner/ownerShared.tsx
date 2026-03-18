import { useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, XCircle, MinusCircle, RefreshCw, Loader2, Upload, ImageIcon, LayoutDashboard, CalendarDays, Building2, Wrench, Clock, Users, BarChart2, Settings } from 'lucide-react';
import { uploadFile } from '../../services/api';

export type View = 'overview' | 'appointments' | 'branches' | 'services' | 'schedules' | 'clients' | 'reports' | 'custom-fields' | 'settings';

export const SC: Record<string, string> = { PENDING: 'bg-amber-50 text-amber-700 border-amber-200', CONFIRMED: 'bg-green-50 text-green-700 border-green-200', CANCELLED: 'bg-red-50 text-red-700 border-red-200', COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200', NO_SHOW: 'bg-gray-100 text-gray-500 border-gray-200', RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-200' };
export const SL: Record<string, string> = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Completada', NO_SHOW: 'No se presentó', RESCHEDULED: 'Reprogramada' };
export const SI: Record<string, React.ReactNode> = { PENDING: <AlertCircle size={11} />, CONFIRMED: <CheckCircle2 size={11} />, CANCELLED: <XCircle size={11} />, COMPLETED: <CheckCircle2 size={11} />, NO_SHOW: <MinusCircle size={11} />, RESCHEDULED: <RefreshCw size={11} /> };
export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const STO = ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
export const KANBAN_COLS = [['PENDING', 'Pendiente'], ['CONFIRMED', 'Confirmada'], ['COMPLETED', 'Completada'], ['CANCELLED', 'Cancelada']];

export const ic = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition';
export const btn = 'bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition';

export const NAV = [
    { key: 'overview' as View, label: 'Dashboard', Icon: LayoutDashboard }, { key: 'appointments' as View, label: 'Citas', Icon: CalendarDays },
    { key: 'branches' as View, label: 'Sucursales', Icon: Building2 }, { key: 'services' as View, label: 'Servicios', Icon: Wrench },
    { key: 'schedules' as View, label: 'Horarios', Icon: Clock }, { key: 'clients' as View, label: 'Clientes', Icon: Users },
    { key: 'reports' as View, label: 'Reportes', Icon: BarChart2 }, { key: 'custom-fields' as View, label: 'Formularios', Icon: Settings },
    { key: 'settings' as View, label: 'Configuración', Icon: Settings },
];

export function Spinner() { return <div className="py-16 flex items-center justify-center"><Loader2 size={20} className="text-blue-400 animate-spin" /></div>; }
export function Empty({ msg }: { msg: string }) { return <div className="bg-white border border-gray-100 rounded-xl py-14 text-center text-gray-400 text-sm">{msg}</div>; }
export function Hdr({ title, sub }: { title: string; sub: string }) { return <div><h1 className="text-xl font-bold text-gray-900">{title}</h1><p className="text-gray-400 text-sm mt-0.5">{sub}</p></div>; }
export function Badge({ status }: { status: string }) { return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${SC[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>{SI[status]}{SL[status] ?? status}</span>; }

export function initials(name: string) { const p = name?.trim().split(' '); return p?.length > 1 ? `${p[0][0]}${p[1][0]}` : (p[0]?.[0] ?? '?'); }
export const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'];
export function Avatar({ name, size = 8 }: { name: string; size?: number }) { const i = name.charCodeAt(0) % AVATAR_COLORS.length; return <div className={`w-${size} h-${size} ${AVATAR_COLORS[i]} rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0`}>{initials(name)}</div>; }

export function ImageUploader({ value, onChange, label = 'Imagen', className = '' }:
    { value?: string; onChange: (url: string) => void; label?: string; className?: string }) {
    const ref = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true); setError('');
        try {
            const url = await uploadFile(file);
            onChange(url);
        } catch { setError('Error al subir imagen'); }
        finally { setUploading(false); }
    };
    return (
        <div className={`${className}`}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <div className="flex gap-3 items-start">
                <div
                    onClick={() => ref.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition overflow-hidden shrink-0">
                    {value
                        ? <img src={value} alt="preview" className="w-full h-full object-cover" />
                        : uploading
                            ? <Loader2 size={18} className="text-blue-400 animate-spin" />
                            : <><ImageIcon size={18} className="text-gray-300 mb-1" /><span className="text-xs text-gray-400">Subir</span></>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <button type="button" onClick={() => ref.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <Upload size={12} />{uploading ? 'Subiendo...' : 'Seleccionar imagen'}
                    </button>
                    {value && <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-600">Quitar</button>}
                    <p className="text-gray-400 text-xs">JPG, PNG, WEBP · máx 5MB</p>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
            </div>
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
    );
}
