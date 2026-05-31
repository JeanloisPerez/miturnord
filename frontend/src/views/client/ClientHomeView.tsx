import { useState, useEffect } from 'react';
import { Home, Zap, Target, Layers, Building2 } from 'lucide-react';
import { BANNERS, TypeIcon } from './clientShared';
import type { Institution, InstitutionType } from './clientShared';
import InstitutionCard from './InstitutionCard';

// ─── Home View ────────────────────────────────────────────────────────────────
export default function ClientHomeView({
    institutions, browseLoading, iTypes, activeType,
    setActiveType, loadInstitutions, onOpenInstitution
}: {
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
        const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 5000);
        return () => clearInterval(t);
    }, []);

    const BannerIcons = [Zap, Target, Layers];

    return (
        <div className="pb-24">
            {/* Hero banners with modern aesthetic */}
            <div className="relative overflow-hidden m-4 rounded-[32px] shadow-sm">
                <div className="flex transition-transform duration-1000 ease-in-out h-[220px] md:h-[300px]"
                    style={{ transform: `translateX(-${bannerIdx * 100}%)` }}>
                    {BANNERS.map((b, i) => {
                        const Icon = BannerIcons[i];
                        return (
                            <div key={i} className={`min-w-full bg-gradient-to-br ${b.g} px-8 py-10 md:px-14 flex items-center justify-between relative overflow-hidden`}>
                                {/* Decorative elements */}
                                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-white/5 rounded-full blur-3xl transform rotate-12"></div>
                                <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[150%] bg-black/10 rounded-full blur-3xl"></div>
                                
                                <div className="text-white max-w-lg z-10">
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/20">
                                        Destacado
                                    </span>
                                    <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight shadow-sm text-balance">
                                        {b.title}
                                    </h2>
                                    <p className="text-white/80 mt-3 text-sm md:text-lg font-medium">
                                        {b.sub}
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center justify-center bg-white/10 backdrop-blur-md w-32 h-32 rounded-[2rem] border border-white/20 shadow-xl rotate-12 z-10 transition-transform duration-700 hover:rotate-0">
                                    <Icon size={64} className="text-white" strokeWidth={1.5} />
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Dots indicator */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                    {BANNERS.map((_, i) => (
                        <button key={i} onClick={() => setBannerIdx(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === bannerIdx ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`} />
                    ))}
                </div>
            </div>

            <div className="px-6 py-4 max-w-7xl mx-auto space-y-10">
                {/* Category selectors (Glassmorphism inspired) */}
                {iTypes.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x pt-2">
                        <button onClick={() => { setActiveType(null); loadInstitutions(undefined, null); }}
                            className="flex flex-col items-center gap-2 shrink-0 group snap-center focus:outline-none">
                            <div className={`w-[72px] h-[72px] rounded-[24px] flex items-center justify-center shadow-sm transition-all duration-300
                                ${activeType === null 
                                    ? 'bg-black shadow-lg shadow-black/20 scale-105' 
                                    : 'bg-white border hover:bg-gray-50 border-gray-100 group-hover:shadow-md group-hover:-translate-y-1'}`}>
                                <Home size={28} className={activeType === null ? 'text-white' : 'text-gray-500 group-hover:text-black'} strokeWidth={1.5} />
                            </div>
                            <span className={`text-xs font-bold transition-colors ${activeType === null ? 'text-black' : 'text-gray-400 group-hover:text-gray-900'}`}>Todos</span>
                        </button>
                        
                        {iTypes.map(t => {
                            const isActive = activeType === t.id;
                            return (
                                <button key={t.id}
                                    onClick={() => {
                                        const next = isActive ? null : t.id;
                                        setActiveType(next);
                                        loadInstitutions(undefined, next);
                                    }}
                                    className="flex flex-col items-center gap-2 shrink-0 group snap-center focus:outline-none">
                                    <div className={`w-[72px] h-[72px] rounded-[24px] flex items-center justify-center shadow-sm transition-all duration-300
                                        ${isActive 
                                            ? 'bg-black shadow-lg shadow-black/20 scale-105' 
                                            : 'bg-white border hover:bg-gray-50 border-gray-100 group-hover:shadow-md group-hover:-translate-y-1'}`}>
                                        <TypeIcon name={t.name} size={28} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-black'} strokeWidth={1.5} />
                                    </div>
                                    <span className={`text-xs font-bold text-center whitespace-nowrap transition-colors ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-900'}`}>{t.name}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Section: Institutions List */}
                <div className="space-y-6">
                    <div className="flex items-end justify-between px-2">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {activeType ? iTypes.find(t => t.id === activeType)?.name ?? 'Instituciones' : 'Descubre instituciones'}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Explora lugares disponibles y reserva al instante</p>
                        </div>
                    </div>

                    {browseLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1,2,3,4].map(n => (
                                <div key={n} className="bg-gray-100 h-80 rounded-[28px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : institutions.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-[32px] text-center py-24 flex flex-col items-center shadow-sm">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Building2 size={40} className="text-gray-300" />
                            </div>
                            <h3 className="font-black text-xl text-gray-900 mb-2">Sin resultados</h3>
                            <p className="text-gray-400 max-w-sm">No pudimos encontrar instituciones que coincidan con tu búsqueda en esta categoría.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                            {institutions.map(inst => (
                                <InstitutionCard key={inst.id} inst={inst} onClick={() => onOpenInstitution(inst)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
