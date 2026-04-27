import DashboardShell from './DashboardShell';

export default function EnseignantDashboard() {
  return (
    <DashboardShell title="Tableau de bord — Enseignant">
      <div className="mb-8">
        <div className="glass rounded-3xl p-6 md:p-8 overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-primary/30 to-purple-500/20 blur-2xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-secondary/25 to-primary/15 blur-2xl rounded-full" />
          <div className="relative">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Espace Enseignant
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Accédez à vos classes, gérez les notes et communiquez avec les étudiants et parents.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold text-slate-900">Mes classes</h3>
          <p className="text-sm text-slate-600 mt-2">
            Accès rapide aux classes et groupes dont vous avez la charge.
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold text-slate-900">Saisie des notes</h3>
          <p className="text-sm text-slate-600 mt-2">
            Ajouter / modifier les notes, consulter les historiques.
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold text-slate-900">Communication</h3>
          <p className="text-sm text-slate-600 mt-2">
            Messages avec les étudiants et les parents.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

