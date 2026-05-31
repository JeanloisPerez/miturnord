import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getInstitutions } from '../../services/api';
import type { Institution } from './clientShared';
import InstitutionCard from './InstitutionCard';

export default function ClientSearchView({
    searchQuery,
    onOpenInstitution
}: {
    searchQuery: string;
    onOpenInstitution: (inst: Institution) => void;
}) {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResults = async () => {
            setLoading(true);
            try {
                const res = await getInstitutions(searchQuery || undefined);
                setInstitutions(res.data);
            } catch (error) {
                console.error(error);
                setInstitutions([]);
            } finally {
                setLoading(false);
            }
        };

        // We load immediately since the dashboard already debounced it
        // Or if we trigger on Enter, there's no debounce needed anyway.
        loadResults();
    }, [searchQuery]);

    return (
        <div className="pb-24">
            <div className="bg-white border-b border-gray-100 py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {searchQuery ? `Resultados para "${searchQuery}"` : 'Todas las instituciones'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {loading 
                            ? 'Buscando coincidencias...' 
                            : `Se encontraron ${institutions.length} resultados`}
                    </p>
                </div>
            </div>

            <div className="px-6 py-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Buscando...</p>
                    </div>
                ) : institutions.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-[32px] text-center py-24 flex flex-col items-center shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Search size={40} className="text-gray-300" />
                        </div>
                        <h3 className="font-black text-xl text-gray-900 mb-2">Sin resultados</h3>
                        <p className="text-gray-400 max-w-sm">No pudimos encontrar instituciones o servicios que coincidan con "{searchQuery}". Prueba con otras palabras clave.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                        {institutions.map(inst => (
                            <InstitutionCard key={inst.id} inst={inst} onClick={() => onOpenInstitution(inst)} searchQuery={searchQuery} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
