import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Users, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getReports, getServicesByInstitution, getBranches } from '../../services/api';
import { Hdr, Spinner, Badge, btn, ic } from './ownerShared';

export default function OwnerReportsView({ instId }: { instId: string }) {
    const [range, setRange] = useState<'week' | 'month'>('week');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', serviceId: '', branchId: '' });

    useEffect(() => {
        getServicesByInstitution(instId).then((r: any) => setServices(r.data));
        getBranches(instId).then((r: any) => setBranches(r.data));
    }, [instId]);

    const loadData = () => {
        setLoading(true);
        const p: any = {};
        if (filters.startDate && filters.endDate) { p.startDate = filters.startDate; p.endDate = filters.endDate; }
        if (filters.serviceId) p.serviceId = filters.serviceId;
        if (filters.branchId) p.branchId = filters.branchId;

        getReports(instId, (p.startDate) ? undefined : range, p)
            .then(r => setReport(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, [instId, range]); // trigger on range change, but not directly on every filter keystroke

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        loadData();
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', serviceId: '', branchId: '' });
        setRange('week'); // triggers useEffect
    };

    const statusItems = report ? Object.entries(report.range?.statusCounts ?? {}).filter(([, v]) => (v as number) > 0) : [];

    return (
        <div className="space-y-5 max-w-5xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <Hdr title="Reportes" sub="Analiza el rendimiento temporal y segmentado" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${showFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <Filter size={14} /> Filtros {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {(['week', 'month'] as const).map(r => (
                        <button key={r} onClick={() => { setFilters({ ...filters, startDate: '', endDate: '' }); setRange(r); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${range === r && !filters.startDate ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {r === 'week' ? '1 sem' : '1 mes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Panel de Filtros */}
            {showFilters && (
                <form onSubmit={handleApply} className="bg-white border text-sm border-gray-200 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Desde (Fecha)</label>
                            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className={ic} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta (Fecha)</label>
                            <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className={ic} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Servicio</label>
                            <select value={filters.serviceId} onChange={e => setFilters(f => ({ ...f, serviceId: e.target.value }))} className={ic}>
                                <option value="">Todos los servicios</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Sucursal</label>
                            <select value={filters.branchId} onChange={e => setFilters(f => ({ ...f, branchId: e.target.value }))} className={ic}>
                                <option value="">Todas las sucursales</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={clearFilters} className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition">Limpiar</button>
                        <button type="submit" className={`${btn} text-xs px-4`}>Aplicar Filtros</button>
                    </div>
                </form>
            )}
            {loading ? <Spinner /> : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total citas', val: report?.range?.total ?? 0, Icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
                            { label: 'Confirmadas', val: report?.range?.statusCounts?.CONFIRMED ?? 0, Icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
                            { label: 'Canceladas', val: report?.range?.statusCounts?.CANCELLED ?? 0, Icon: XCircle, color: 'text-red-500 bg-red-50' },
                            { label: 'Clientes únicos', val: report?.range?.uniqueClients ?? 0, Icon: Users, color: 'text-violet-600 bg-violet-50' },
                        ].map(s => (
                            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
                                <div className={`w-8 h-8 rounded-lg ${s.color.split(' ')[1]} flex items-center justify-center mb-3`}><s.Icon size={15} className={s.color.split(' ')[0]} /></div>
                                <p className="text-2xl font-bold text-gray-900">{s.val}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 overflow-hidden">
                            <p className="text-gray-800 font-semibold text-sm mb-1">Citas por día</p>
                            <p className="text-gray-400 text-xs mb-4">{report?.range?.label}</p>
                            <div className="w-full min-w-0">
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={report?.byDay ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={d => new Date(d).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' })} />
                                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                                        <Tooltip formatter={val => [`${val} citas`, '']} labelFormatter={d => new Date(d).toLocaleDateString('es-DO', { dateStyle: 'medium' })} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Por estado</p>
                                <div className="space-y-2">
                                    {statusItems.map(([s, c]) => <div key={s} className="flex items-center justify-between text-sm"><Badge status={s} /><span className="text-gray-600 font-semibold">{String(c)}</span></div>)}
                                    {statusItems.length === 0 && <p className="text-gray-400 text-xs text-center py-2">Sin datos</p>}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Top servicios</p>
                                <div className="space-y-2">
                                    {(report?.topServices ?? []).slice(0, 4).map((s: any) => (
                                        <div key={s.name} className="flex items-center gap-2">
                                            <p className="text-xs text-gray-600 flex-1 truncate">{s.name}</p>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((s.count / (report.topServices[0]?.count || 1)) * 100, 100)}%` }} /></div>
                                            <span className="text-xs text-gray-500 w-4 text-right">{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
