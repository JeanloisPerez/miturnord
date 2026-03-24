import { useEffect, useState } from 'react';
import { api, unwrap } from '../api';
import { Search, UserCircle2 } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  roles: { role: { name: string } }[];
  institution_memberships: { role: string; institution: { name: string } }[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/adminList')
      .then(res => { setUsers(unwrap(res) || []); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los usuarios.'); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    [u.full_name, u.email, u.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const roleLabel = (u: User) => {
    const global = u.roles.map(r => r.role.name);
    const inst = u.institution_memberships.map(m => m.role);
    return [...global, ...inst].join(', ') || 'CLIENT';
  };

  const roleColor = (u: User) => {
    const roles = u.roles.map(r => r.role.name);
    if (roles.includes('SAAS_ADMIN')) return 'bg-red-100 text-red-700';
    if (roles.includes('INSTITUTION_OWNER')) return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Usuarios</h1>
      <p className="text-gray-500 mb-6">Todos los usuarios registrados en la plataforma</p>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Usuario</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Contacto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Rol</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Institución</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No se encontraron usuarios</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <UserCircle2 size={20} className="text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <p>{u.email ?? '—'}</p>
                    <p className="text-xs text-gray-400">{u.phone ?? ''}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColor(u)}`}>
                      {roleLabel(u)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {u.institution_memberships.map(m => m.institution.name).join(', ') || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
