import { Users } from 'lucide-react';
export default function ParentEnfants() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mes Enfants</h1>
        <p className="text-slate-500 mt-1">Vos enfants.</p>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/60 p-12 shadow-sm text-center">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-600 mb-2">Module en cours</h3>
        <p className="text-slate-400">Cette section sera disponible prochainement.</p>
      </div>
    </div>
  );
}
