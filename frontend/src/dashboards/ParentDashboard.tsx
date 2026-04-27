import DashboardShell from './DashboardShell';

export default function ParentDashboard() {
  return (
    <DashboardShell title="Tableau de bord — Parent">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Mes enfants</h3>
          <p className="text-sm text-slate-600 mt-2">
            Sélectionner un enfant et consulter son parcours.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Notes & bulletins</h3>
          <p className="text-sm text-slate-600 mt-2">
            Notes, moyennes, et documents de suivi.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Communication</h3>
          <p className="text-sm text-slate-600 mt-2">
            Messages avec l’établissement et les enseignants.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

