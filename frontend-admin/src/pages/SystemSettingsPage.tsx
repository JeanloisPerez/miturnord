import { useEffect, useState } from 'react';
import { api, unwrap } from '../api';
import { Save } from 'lucide-react';

interface Settings {
  cron_reminder_frequency_minutes: number;
  log_retention_days: number;
  updated_at: string;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cron, setCron] = useState('');
  const [logDays, setLogDays] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/systemSettings/getSettings')
      .then(res => {
        const data = unwrap(res);
        setSettings(data);
        setCron(String(data.cron_reminder_frequency_minutes));
        setLogDays(String(data.log_retention_days));
        setLoading(false);
      })
      .catch(() => { setError('No se pudieron cargar los ajustes.'); setLoading(false); });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    api.patch('/systemSettings/updateSettings', {
      cron_reminder_frequency_minutes: Number(cron),
      log_retention_days: Number(logDays),
    })
      .then(res => {
        const data = unwrap(res);
        setSettings(data);
        setSuccess('Configuración guardada correctamente.');
      })
      .catch(() => setError('No se pudo guardar la configuración.'))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuración del Sistema</h1>
      <p className="text-gray-500 mb-6">Ajustes globales de la plataforma MiTurnoRD</p>

      {settings && (
        <p className="text-xs text-gray-400 mb-6">
          Última actualización: {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Frecuencia del Cron de Recordatorios (minutos)
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Cada cuántos minutos el sistema envía recordatorios de citas por email.
          </p>
          <input
            type="number"
            min={1}
            value={cron}
            onChange={e => setCron(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Retención de Logs (días)
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Por cuántos días se conservan los registros de recordatorios enviados.
          </p>
          <input
            type="number"
            min={1}
            value={logDays}
            onChange={e => setLogDays(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
