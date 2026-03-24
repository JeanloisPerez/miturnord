import { useEffect, useState } from 'react';
import { api, unwrap } from '../api';
import { Search, Building2, CheckCircle, XCircle } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  slug: string;
  status: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  institution_type: { name: string; icon: string | null } | null;
  _count: { appointments: number; branches: number; services: number; users: number };
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (q?: string) => {
    setLoading(true);
    api.get('/institutions/adminList', { params: q ? { search: q } : {} })
      .then(res => { setInstitutions(unwrap(res) || []); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las instituciones.'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Instituciones</h1>
      <p className="text-gray-500 mb-6">Todas las instituciones registradas en la plataforma</p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar institución..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Buscar
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Tipo</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Estado</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Sucursales</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Servicios</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Citas</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Usuarios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {institutions.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">No se encontraron instituciones</td></tr>
              ) : institutions.map(inst => (
                <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{inst.name}</p>
                        <p className="text-xs text-gray-400">{inst.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{inst.institution_type?.name ?? '—'}</td>
                  <td className="py-3 px-4 text-center">
                    {inst.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={12} /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle size={12} /> {inst.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">{inst._count.branches}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{inst._count.services}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{inst._count.appointments}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{inst._count.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
