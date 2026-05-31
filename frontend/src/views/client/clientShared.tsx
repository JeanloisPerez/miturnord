import { Zap, Target, Layers, Heart, Landmark, ShieldCheck, Scissors, Briefcase, Building2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type View = 'home' | 'institution' | 'appointments' | 'profile' | 'search';
export type BookStep = 0 | 1 | 2 | 3 | 4;

export interface InstitutionType { id: string; name: string; icon?: string; }
export interface Institution { id: string; name: string; description?: string; institution_type?: InstitutionType; services?: any[]; _count?: { appointments: number }; logo_url?: string; }
export interface Branch { id: string; name: string; address?: string; city?: string; phone?: string; latitude?: number; longitude?: number; is_main: boolean; }
export interface Service { id: string; name: string; description?: string; duration: number; price?: number; image_url?: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getTypeGradient(name = ''): string {
    const n = name.toLowerCase();
    if (n.includes('salud') || n.includes('clinic') || n.includes('medic')) return 'from-emerald-400 to-teal-600';
    if (n.includes('banco') || n.includes('financ')) return 'from-blue-500 to-indigo-700';
    if (n.includes('gobierno') || n.includes('public')) return 'from-slate-400 to-slate-700';
    if (n.includes('barber') || n.includes('belleza') || n.includes('spa')) return 'from-pink-400 to-rose-600';
    if (n.includes('servicio') || n.includes('profesional')) return 'from-amber-400 to-orange-600';
    return 'from-blue-500 to-blue-700';
}

export function generateTurnCode(id: string): string {
    const l = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return `${l[Math.abs((id.charCodeAt(0) || 65) - 65) % 26]}-${(parseInt(id.replace(/\\D/g, '').slice(0, 4) || '1000', 10) % 9000) + 1000}`;
}
export const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtDT = (iso: string) => new Date(iso).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short', hour12: false });
export const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Constants ────────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
    RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-200',
    NO_SHOW: 'bg-gray-100 text-gray-500 border-gray-200',
};
export const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada',
    COMPLETED: 'Completada', RESCHEDULED: 'Reprogramada', NO_SHOW: 'No asistió',
};
export const FIELD_INPUTS: Record<string, string> = {
    TEXT: 'text', NUMBER: 'number', DATE: 'date', EMAIL: 'email', PHONE: 'tel', SELECT: 'select',
};
export const BANNERS = [
    { title: 'Reserva en segundos', sub: 'Agenda tu turno sin filas ni esperas', cta: 'Explorar', g: 'from-blue-600 to-blue-800', Icon: Zap },
    { title: 'Sin filas, sin esperas', sub: 'Llega justo a tu hora de atención', cta: 'Ver instituciones', g: 'from-purple-600 to-indigo-800', Icon: Target },
    { title: 'Más de 50 instituciones', sub: 'Bancos, clínicas, barberías y más', cta: 'Comenzar', g: 'from-emerald-500 to-teal-700', Icon: Layers },
];
export const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

/** Returns a Lucide icon matching the institution type name */
export function TypeIcon({ name = '', size = 18, className = '', strokeWidth }: { name?: string; size?: number; className?: string; strokeWidth?: number }) {
    const n = name.toLowerCase();
    if (n.includes('salud') || n.includes('clinic') || n.includes('medic')) return <Heart size={size} className={className} strokeWidth={strokeWidth} />;
    if (n.includes('banco') || n.includes('financ')) return <Landmark size={size} className={className} strokeWidth={strokeWidth} />;
    if (n.includes('gobierno') || n.includes('public')) return <ShieldCheck size={size} className={className} strokeWidth={strokeWidth} />;
    if (n.includes('barber') || n.includes('belleza') || n.includes('spa')) return <Scissors size={size} className={className} strokeWidth={strokeWidth} />;
    if (n.includes('servicio') || n.includes('profesional')) return <Briefcase size={size} className={className} strokeWidth={strokeWidth} />;
    return <Building2 size={size} className={className} strokeWidth={strokeWidth} />;
}
