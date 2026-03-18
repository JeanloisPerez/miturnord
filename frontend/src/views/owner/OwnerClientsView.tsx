import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { getInstitutionClients } from '../../services/api';
import { Hdr, Spinner, Empty, Avatar, Badge } from './ownerShared';

export default function OwnerClientsView({ instId }: { instId: string }) {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => { getInstitutionClients(instId).then(r => setClients(r.data)).finally(() => setLoading(false)); }, [instId]);

    const filtered = clients.filter(c => !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <Spinner />;

    return (
        <div className="space-y-5 max-w-4xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Hdr title="Clientes" sub={`${clients.length} clientes han agendado contigo`} />
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-52" />
                </div>
            </div>
            {filtered.length === 0 ? <Empty msg="Sin clientes" /> : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span className="col-span-4">Cliente</span>
                        <span className="col-span-2 text-center">Visitas</span>
                        <span className="col-span-3">Última cita</span>
                        <span className="col-span-3">Estado último</span>
                    </div>
                    {filtered.map(c => {
                        const last = c.appointments?.[c.appointments.length - 1];
                        return (
                            <div key={c.id} className="border-b border-gray-50 last:border-0">
                                <button className="w-full grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50 transition text-left gap-2" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                                    <div className="col-span-4 flex items-center gap-3">
                                        <Avatar name={c.full_name || '?'} />
                                        <div className="min-w-0">
                                            <p className="text-gray-900 font-semibold text-sm truncate">{c.full_name}</p>
                                            <p className="text-gray-400 text-xs truncate">{c.email}</p>
                                        </div>
                                    </div>
                                    <span className="col-span-2 text-center text-gray-600 font-bold text-sm">{c.appointments?.length ?? 0}</span>
                                    <span className="col-span-3 text-gray-500 text-xs truncate">{last ? new Date(last.date).toLocaleDateString('es-DO', { dateStyle: 'medium' }) : '—'}</span>
                                    <div className="col-span-3 flex items-center justify-between">
                                        {last ? <Badge status={last.status} /> : <span className="text-gray-300 text-xs">—</span>}
                                        {expanded === c.id ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                                    </div>
                                </button>
                                {expanded === c.id && (
                                    <div className="px-5 pb-4">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Historial de citas</p>
                                        <div className="space-y-1.5">
                                            {(c.appointments ?? []).map((a: any) => (
                                                <div key={a.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                                                    <span className="text-gray-600 font-medium truncate flex-1">{a.service}</span>
                                                    <span className="text-gray-400 w-24 text-right">{new Date(a.date).toLocaleDateString('es-DO', { dateStyle: 'short' })}</span>
                                                    <div className="w-24 flex justify-end"><Badge status={a.status} /></div>
                                                </div>
                                            ))}
                                            {(c.appointments ?? []).length === 0 && <p className="text-gray-400 text-xs py-2">Sin historial</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
