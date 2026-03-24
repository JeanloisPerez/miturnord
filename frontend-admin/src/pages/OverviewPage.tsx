import { useEffect, useState } from 'react';
import { api, unwrap } from '../api';
import { Building2, Users, CalendarCheck, Activity } from 'lucide-react';

interface Stats {
  institutions: number;
  activeInstitutions: number;
  users: number;
  appointments: number;
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/institutions/adminStats')
      .then(res => setStats(unwrap(res)))
      .catch(() => setError('No se pudieron cargar las estadísticas.'));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Resumen de la Plataforma</h1>
      <p className="text-gray-500 mb-6">Estadísticas globales en tiempo real de MiTurnoRD</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Total Instituciones" value={stats?.institutions ?? '—'} color="bg-blue-500" />
        <StatCard icon={Activity} label="Instituciones Activas" value={stats?.activeInstitutions ?? '—'} color="bg-green-500" />
        <StatCard icon={Users} label="Usuarios Registrados" value={stats?.users ?? '—'} color="bg-purple-500" />
        <StatCard icon={CalendarCheck} label="Total Citas" value={stats?.appointments ?? '—'} color="bg-orange-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-2">Estado del sistema</h2>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-green-700 font-medium text-sm">Todos los servicios operativos</span>
        </div>
      </div>
    </div>
  );
}
