import { Star, ArrowRight } from 'lucide-react';
import { getTypeGradient } from './clientShared';
import type { Institution } from './clientShared';

export default function InstitutionCard({ inst, onClick, searchQuery }: { inst: Institution; onClick: () => void; searchQuery?: string }) {
    const typeName = inst.institution_type?.name || '';
    const gradient = getTypeGradient(typeName);
    const logoUrl = inst.logo_url;


    // Find matching services
    const matchingServices = searchQuery
        ? inst.services?.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())) || []
        : [];

    return (
        <button onClick={onClick}
            className="group relative bg-white border border-gray-100 rounded-[28px] overflow-hidden text-left hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 w-full flex flex-col h-full focus:outline-none focus:ring-4 focus:ring-blue-100">
            {/* Cover image or gradient */}
            {logoUrl ? (
                <div className="h-44 relative overflow-hidden shrink-0">
                    <img src={logoUrl} alt={inst.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/30 truncate max-w-[70%] text-white text-xs font-semibold shadow-sm">
                            {typeName}
                        </div>
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/30 text-white shadow-sm">
                            <Star size={12} className="fill-white" />
                            <span className="text-xs font-bold">5.0</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden shrink-0`}>
                    <span className="text-8xl opacity-15 absolute right-4 bottom-[-10px] transform rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                        {inst.institution_type?.icon || '🏢'}
                    </span>
                    <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        <span className="text-white font-black text-4xl">{inst.name[0]}</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
                        <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white text-xs font-semibold">
                            {typeName || 'General'}
                        </div>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="p-5 flex flex-col flex-1 bg-white relative">
                {/* Float action button -> pops up on hover */}
                <div className="absolute right-5 -top-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <ArrowRight size={20} />
                </div>

                <div className="pr-10">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">{inst.name}</h3>
                </div>

                {matchingServices.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1">
                        <span className="text-xs font-bold text-blue-600">Servicios encontrados:</span>
                        <div className="flex flex-wrap gap-1">
                            {matchingServices.slice(0, 2).map(s => (
                                <span key={s.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[11px] font-medium truncate max-w-[150px]">
                                    {s.name}
                                </span>
                            ))}
                            {matchingServices.length > 2 && (
                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[11px] font-medium">
                                    +{matchingServices.length - 2}
                                </span>
                            )}
                        </div>
                    </div>
                ) : inst.description ? (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed flex-1">{inst.description}</p>
                ) : (
                    <div className="flex-1" />
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Servicios</span>
                        <span className="text-sm font-semibold text-gray-800">{inst.services?.length ?? 0}</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Turnos Hoy</span>
                        <span className="text-sm font-semibold text-gray-800">{inst._count?.appointments ?? 0}</span>
                    </div>
                </div>
            </div>
        </button>
    );
}
