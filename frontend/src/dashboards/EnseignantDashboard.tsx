import { useEffect, useState } from 'react';
import { Users, GraduationCap, FileSpreadsheet, MessageSquare, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function EnseignantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    classes: 0, 
    students: 0, 
    pendingReclamations: 0,
    absencesThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentReclamations, setRecentReclamations] = useState<any[]>([]);
  const [recentEvaluations, setRecentEvaluations] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user) return;
        const teacherRes = await api.get(`/accounts/enseignants/?utilisateur=${user.id}`);
        const teacher = teacherRes.data.results?.[0] || teacherRes.data[0];
        
        if (!teacher) return;

        const [assignRes, reclamationsRes, absencesRes] = await Promise.all([
          api.get(`/academics/enseignant-matieres/?enseignant=${teacher.id}`),
          api.get('/communication/reclamations/'),
          api.get('/academics/absences/'),
        ]);

        const assignments = assignRes.data.results || assignRes.data;
        const uniqueClassIds = [...new Set(assignments.map((a: any) => a.classe))];
        
        // Fetch each class to get the nb_etudiants
        const classPromises = uniqueClassIds.map(id => api.get(`/academics/classes/${id}/`));
        const classResponses = await Promise.all(classPromises);
        const totalStudents = classResponses.reduce((sum, res) => sum + (res.data.nb_etudiants || 0), 0);
        
        const myReclamations = (reclamationsRes.data.results || reclamationsRes.data).filter(
          (r: any) => r.destinataire === user.id
        );
        const pendingRecs = myReclamations.filter((r: any) => r.statut === 'en_attente');

        const myAbsences = (absencesRes.data.results || absencesRes.data).filter(
          (a: any) => assignments.some((as: any) => as.id === a.enseignant_matiere)
        );

        // Fetch recent activities
        const [evalsRes] = await Promise.all([
          api.get(`/grades/evaluations/?enseignant=${teacher.id}`),
        ]);
        const myEvals = evalsRes.data.results || evalsRes.data;

        setStats({
          classes: uniqueClassIds.length,
          students: totalStudents,
          pendingReclamations: pendingRecs.length,
          absencesThisWeek: myAbsences.length
        });

        setRecentReclamations(pendingRecs.slice(0, 3));
        setRecentEvaluations(myEvals.slice(0, 3));

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard Enseignant</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Bienvenue, {user?.first_name}. Voici l'état de vos activités pédagogiques.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Mes Classes" value={stats.classes} icon={GraduationCap} color="bg-blue-600" />
        <StatCard title="Total Étudiants" value={stats.students} icon={Users} color="bg-emerald-600" />
        <StatCard title="Réclamations" value={stats.pendingReclamations} icon={MessageSquare} color="bg-amber-600" trend={stats.pendingReclamations > 0 ? "À traiter" : ""} />
        <StatCard title="Absences Notées" value={stats.absencesThisWeek} icon={Activity} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Evaluations récentes</h2>
          </div>
          <div className="space-y-4">
            {recentEvaluations.length > 0 ? recentEvaluations.map((ev, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 group hover:bg-white hover:border-indigo-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{ev.matiere_name}</p>
                  <p className="text-xs text-slate-500 font-medium">{ev.classe_name} - {ev.date || 'Non planifiée'}</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-2xl">
                Aucune évaluation récente.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Réclamations urgentes</h2>
            </div>
            {stats.pendingReclamations > 0 && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg uppercase tracking-wider animate-pulse">
                {stats.pendingReclamations} nouvelle(s)
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {recentReclamations.length > 0 ? recentReclamations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-amber-200 hover:bg-white transition-all duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">{rec.expediteur_details?.utilisateur?.first_name} {rec.expediteur_details?.utilisateur?.last_name}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(rec.date_creation).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">"{rec.message}"</p>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-medium italic">
                Aucune réclamation en attente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: { title: string, value: number, icon: any, color: string, trend?: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group border-b-4 border-b-transparent hover:border-b-indigo-500">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider">{trend}</span>}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
      </div>
    </div>
  );
}

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

