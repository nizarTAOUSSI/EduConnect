import DashboardShell from './DashboardShell';

export default function EtudiantDashboard() {
  return (
    <DashboardShell title="Tableau de bord — Étudiant">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Mes notes</h3>
          <p className="text-sm text-slate-600 mt-2">
            Consulter vos notes par matière et par semestre.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Rapports</h3>
          <p className="text-sm text-slate-600 mt-2">
            Bulletins, relevés, et téléchargements.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">Messages</h3>
          <p className="text-sm text-slate-600 mt-2">
            Notifications et échanges avec vos enseignants.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

