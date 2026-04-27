import DashboardShell from './DashboardShell';

export default function AdminDashboard() {
  return (
    <DashboardShell title="Tableau de bord — Admin">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Gestion</h3>
          <p className="text-sm text-slate-600 mt-2">
            Utilisateurs, rôles, paramètres, et supervision de la plateforme.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Statistiques</h3>
          <p className="text-sm text-slate-600 mt-2">
            KPI, activité, inscriptions, et suivi global.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Modération</h3>
          <p className="text-sm text-slate-600 mt-2">
            Communication, signalements, et contrôle des contenus.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

