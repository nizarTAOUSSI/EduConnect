import DashboardShell from './DashboardShell';

export default function EnseignantDashboard() {
  return (
    <DashboardShell title="Tableau de bord — Enseignant">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Mes classes</h3>
          <p className="text-sm text-slate-600 mt-2">
            Accès rapide aux classes et groupes dont vous avez la charge.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Saisie des notes</h3>
          <p className="text-sm text-slate-600 mt-2">
            Ajouter / modifier les notes, consulter les historiques.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Communication</h3>
          <p className="text-sm text-slate-600 mt-2">
            Messages avec les étudiants et les parents.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

