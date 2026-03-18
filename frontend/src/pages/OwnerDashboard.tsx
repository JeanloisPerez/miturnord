import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getInstitution } from '../services/api';
import { Loader2 } from 'lucide-react';

import { NAV } from '../views/owner/ownerShared';
import type { View } from '../views/owner/ownerShared';

import OwnerOverviewView from '../views/owner/OwnerOverviewView';
import OwnerAppointmentsView from '../views/owner/OwnerAppointmentsView';
import OwnerBranchesView from '../views/owner/OwnerBranchesView';
import OwnerServicesView from '../views/owner/OwnerServicesView';
import OwnerSchedulesView from '../views/owner/OwnerSchedulesView';
import OwnerClientsView from '../views/owner/OwnerClientsView';
import OwnerReportsView from '../views/owner/OwnerReportsView';
import OwnerCustomFieldsView from '../views/owner/OwnerCustomFieldsView';
import OwnerSettingsView from '../views/owner/OwnerSettingsView';

export default function OwnerDashboard() {
    const { user } = useAuth();
    const instId = user?.institutionId;
    const [view, setView] = useState<View>('overview');
    const [inst, setInst] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!instId) return;
        getInstitution(instId).then(r => setInst(r.data)).finally(() => setLoading(false));
    }, [instId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={20} className="text-blue-400 animate-spin" /></div>;
    if (!instId) return <div className="min-h-screen flex items-center justify-center text-red-500 text-sm">Sin institución asignada.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-4 shrink-0 overflow-y-auto">
                    <div className="px-4 mb-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Institución</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{inst?.name}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs border ${inst?.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{inst?.status === 'active' ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    <nav className="flex-1">
                        {NAV.map(({ key, label, Icon }) => (
                            <button key={key} onClick={() => setView(key)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${view === key ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Icon size={15} className="shrink-0" />{label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 p-6 overflow-auto min-w-0">
                    {view === 'overview' && <OwnerOverviewView instId={instId} />}
                    {view === 'appointments' && <OwnerAppointmentsView instId={instId} />}
                    {view === 'branches' && <OwnerBranchesView instId={instId} />}
                    {view === 'services' && <OwnerServicesView instId={instId} />}
                    {view === 'schedules' && <OwnerSchedulesView instId={instId} />}
                    {view === 'clients' && <OwnerClientsView instId={instId} />}
                    {view === 'reports' && <OwnerReportsView instId={instId} />}
                    {view === 'custom-fields' && <OwnerCustomFieldsView instId={instId} />}
                    {view === 'settings' && <OwnerSettingsView instId={instId} />}
                </main>
            </div>
        </div>
    );
}
