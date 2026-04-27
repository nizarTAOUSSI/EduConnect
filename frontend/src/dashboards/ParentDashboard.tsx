import DashboardShell from './DashboardShell';

export default function ParentDashboard() {
  return (
    <DashboardShell title="Tableau de bord — Parent">
      <div className="mb-8">
        <div className="glass rounded-3xl p-6 md:p-8 overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-primary/30 to-purple-500/20 blur-2xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-secondary/25 to-primary/15 blur-2xl rounded-full" />
          <div className="relative">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Espace Parent
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Consultez les informations scolaires et suivez l’évolution de vos enfants.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold text-slate-900">Mes enfants</h3>
          <p className="text-sm text-slate-600 mt-2">
            Sélectionner un enfant et consulter son parcours.
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold text-slate-900">Notes & bulletins</h3>
          <p className="text-sm text-slate-600 mt-2">
            Notes, moyennes, et documents de suivi.
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold text-slate-900">Communication</h3>
          <p className="text-sm text-slate-600 mt-2">
            Messages avec l’établissement et les enseignants.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

