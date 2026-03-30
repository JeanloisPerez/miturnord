import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, Users, Filter, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Citas', val: report?.range?.total ?? 0, Icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', isUp: true },
                            { label: 'Confirmadas', val: report?.range?.statusCounts?.CONFIRMED ?? 0, Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', trend: '+5%', isUp: true },
                            { label: 'Ingresos Est.', val: `RD$${(report?.range?.total ?? 0) * 1500}`, Icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+23%', isUp: true },
                            { label: 'Nuevos Clientes', val: report?.range?.uniqueClients ?? 0, Icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', trend: '-2%', isUp: false },
                        ].map(s => (
                            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.Icon size={20} className={s.color} /></div>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${s.isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {s.isUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                        {s.trend}
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{s.val}</p>
                                <p className="text-gray-500 text-sm font-medium">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-gray-900 font-bold text-lg">Tendencia de Citas</p>
                                    <p className="text-gray-400 text-sm">{report?.range?.label}</p>
                                </div>
                            </div>
                            <div className="w-full h-72">
                                <ResponsiveContainer width="100%" height={288} minWidth={0}>
                                    <AreaChart data={report?.byDay ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={d => new Date(d).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' })} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} dx={-10} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val) => [`${val} citas`, 'Total']} 
                                            labelFormatter={d => new Date(d).toLocaleDateString('es-DO', { dateStyle: 'medium' })} 
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-8">
                            <div>
                                <p className="text-gray-900 font-bold text-lg mb-4">Estado de Citas</p>
                                <div className="space-y-3">
                                    {statusItems.map(([s, c]) => (
                                        <div key={s} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <Badge status={s} />
                                            <span className="text-gray-800 font-bold">{String(c)}</span>
                                        </div>
                                    ))}
                                    {statusItems.length === 0 && <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">Sin datos de estado</p>}
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-gray-900 font-bold text-lg mb-4">Top Servicios</p>
                                <div className="space-y-4">
                                    {(report?.topServices ?? []).slice(0, 5).map((s: any) => (
                                        <div key={s.name} className="relative">
                                            <div className="flex items-center justify-between text-sm mb-1.5">
                                                <span className="text-gray-700 font-medium truncate pr-4">{s.name}</span>
                                                <span className="text-gray-900 font-bold">{s.count}</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((s.count / (report.topServices[0]?.count || 1)) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    {(report?.topServices ?? []).length === 0 && <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">Sin servicios registrados</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
