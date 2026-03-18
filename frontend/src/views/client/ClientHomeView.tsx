import { useState, useEffect } from 'react';
import { Home, Zap, Target, Layers, Building2, Loader2, Star } from 'lucide-react';
import { BANNERS, TypeIcon, getTypeGradient } from './clientShared';
import type { Institution, InstitutionType } from './clientShared';

// ─── Institution Card ─────────────────────────────────────────────────────────
function InstitutionCard({ inst, onClick }: { inst: Institution; onClick: () => void }) {
    const typeName = inst.institution_type?.name || '';
    const gradient = getTypeGradient(typeName);
    const logoUrl = inst.logo_url;
    return (
        <button onClick={onClick}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group w-full flex flex-col h-full">
            {/* Cover */}
            {logoUrl ? (
                <div className="h-40 relative overflow-hidden shrink-0">
                    <img src={logoUrl} alt={inst.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
            ) : (
                <div className={`h-40 bg-gradient-to-br ${gradient} relative flex items-center justify-center shrink-0`}>
                    <span className="text-7xl opacity-20 absolute inset-0 flex items-center justify-center select-none">
                        {inst.institution_type?.icon || '🏢'}
                    </span>
                    <div className="relative z-10 w-16 h-16 bg-white/25 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                        <span className="text-white font-black text-3xl">{inst.name[0]}</span>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-black text-gray-900 group-hover:text-blue-600 transition">{inst.name}</p>
                        {inst.institution_type && (
                            <p className="text-gray-400 text-xs mt-0.5">{inst.institution_type.icon} {typeName}</p>
                        )}
                    </div>
                    <Star size={14} className="text-gray-300 mt-0.5 shrink-0" />
                </div>
                {inst.description ? (
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed flex-1">{inst.description}</p>
                ) : (
                    <div className="flex-1" /> // Spacer if no description
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 mt-auto">
                    <span className="text-xs text-gray-400">{inst.services?.length ?? 0} servicio(s)</span>
                    {inst._count && <span className="text-xs text-gray-400">{inst._count.appointments} cita(s)</span>}
                    <span className="ml-auto text-xs font-bold text-black group-hover:underline">Reservar →</span>
                </div>
            </div>
        </button>
    );
}

// ─── Home View ────────────────────────────────────────────────────────────────
export default function ClientHomeView({
    search, institutions, browseLoading, iTypes, activeType,
    setActiveType, loadInstitutions, onOpenInstitution
}: {
    search: string;
    institutions: Institution[];
    browseLoading: boolean;
    iTypes: InstitutionType[];
    activeType: string | null;
    setActiveType: (id: string | null) => void;
    loadInstitutions: (q?: string, typeId?: string | null) => void;
    onOpenInstitution: (inst: Institution) => void;
}) {
    const [bannerIdx, setBannerIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500);
        return () => clearInterval(t);
    }, []);

    const BannerIcons = [Zap, Target, Layers];

    return (
        <div>
            {/* Hero banners */}
            <div className="relative overflow-hidden">
                <div className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${bannerIdx * 100}%)` }}>
                    {BANNERS.map((b, i) => {
                        const Icon = BannerIcons[i];
                        return (
                            <div key={i} className={`min-w-full bg-gradient-to-r ${b.g} px-8 py-10 md:py-14 flex items-center justify-between`}>
                                <div className="text-white max-w-md">
                                    <p className="text-3xl md:text-4xl font-black leading-tight">{b.title}</p>
                                    <p className="text-white/80 mt-2 text-sm md:text-base">{b.sub}</p>
                                    <button className="mt-5 px-6 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-full hover:bg-gray-100 transition shadow">
                                        {b.cta}
                                    </button>
                                </div>
                                <Icon size={96} className="text-white/20 hidden sm:block" strokeWidth={1} />
                            </div>
                        );
                    })}
                </div>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {BANNERS.map((_, i) => (
                        <button key={i} onClick={() => setBannerIdx(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? 'bg-white w-5' : 'bg-white/40'}`} />
                    ))}
                </div>
            </div>

            <div className="px-6 py-6 max-w-6xl mx-auto space-y-8">
                {/* Category icon strip */}
                {iTypes.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                        <button onClick={() => { setActiveType(null); loadInstitutions(search, null); }}
                            className="flex flex-col items-center gap-1.5 shrink-0 group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border-2 transition-all
                                ${activeType === null ? 'border-black bg-black scale-105' : 'border-gray-200 bg-white group-hover:border-gray-300'}`}>
                                <Home size={22} className={activeType === null ? 'text-white' : 'text-gray-500'} />
                            </div>
                            <span className={`text-xs font-medium ${activeType === null ? 'text-black' : 'text-gray-500'}`}>Todos</span>
                        </button>
                        {iTypes.map(t => {
                            const isActive = activeType === t.id;
                            return (
                                <button key={t.id}
                                    onClick={() => {
                                        const next = isActive ? null : t.id;
                                        setActiveType(next);
                                        loadInstitutions(search, next);
                                    }}
                                    className="flex flex-col items-center gap-1.5 shrink-0 group">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border-2 transition-all
                                        ${isActive ? 'border-black bg-black scale-105' : 'border-gray-200 bg-white group-hover:border-gray-300'}`}>
                                        <TypeIcon name={t.name} size={22} className={isActive ? 'text-white' : 'text-gray-500'} />
                                    </div>
                                    <span className={`text-xs font-medium text-center whitespace-nowrap ${isActive ? 'text-black' : 'text-gray-500'}`}>{t.name}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Section: Institutions */}
                {browseLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                    </div>
                ) : institutions.length === 0 ? (
                    <div className="text-center py-24">
                        <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400">No se encontraron instituciones</p>
                    </div>
                ) : (
                    <>
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-gray-900">
                                    {activeType ? iTypes.find(t => t.id === activeType)?.name ?? 'Instituciones' : 'Popular en tu área'}
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
                                {institutions.map(inst => (
                                    <InstitutionCard key={inst.id} inst={inst} onClick={() => onOpenInstitution(inst)} />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
