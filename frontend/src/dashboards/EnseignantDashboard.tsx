import { useEffect, useState } from 'react';
import { Users, GraduationCap, MessageSquare, Activity, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function EnseignantDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('teacher_dashboard.title')}</h1>
        <p className="text-slate-500 mt-1 font-medium">
          {t('teacher_dashboard.welcome', { name: user?.first_name })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('teacher_dashboard.stats.classes')} value={stats.classes} icon={GraduationCap} color="bg-blue-600" />
        <StatCard title={t('teacher_dashboard.stats.students')} value={stats.students} icon={Users} color="bg-emerald-600" />
        <StatCard title={t('teacher_dashboard.stats.reclamations')} value={stats.pendingReclamations} icon={MessageSquare} color="bg-amber-600" trend={stats.pendingReclamations > 0 ? t('teacher_dashboard.stats.to_treat') : ""} />
        <StatCard title={t('teacher_dashboard.stats.absences')} value={stats.absencesThisWeek} icon={Activity} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t('teacher_dashboard.recent_evaluations')}</h3>
            </div>
            <Link to="/dashboard/enseignant/notes" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">{t('teacher_dashboard.view_all')}</Link>
          </div>

          <div className="space-y-4">
            {recentEvaluations.length > 0 ? recentEvaluations.map((evalItem, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{evalItem.matiere_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{evalItem.classe_name} • {evalItem.type_display}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{evalItem.date}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{evalItem.heure_debut?.substring(0,5)}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 italic text-sm">{t('teacher_dashboard.no_recent_evals')}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t('teacher_dashboard.pending_reclamations')}</h3>
            </div>
            <Link to="/dashboard/enseignant/reclamations" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">{t('teacher_dashboard.view_all')}</Link>
          </div>

          <div className="space-y-4">
            {recentReclamations.length > 0 ? recentReclamations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-300 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-400">
                      {rec.expediteur_details?.utilisateur?.first_name?.[0]}{rec.expediteur_details?.utilisateur?.last_name?.[0]}
                    </div>
                    <p className="text-xs font-bold text-slate-900">{rec.expediteur_details?.utilisateur?.first_name} {rec.expediteur_details?.utilisateur?.last_name}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(rec.date_creation).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 italic">"{rec.message}"</p>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 italic text-sm">{t('teacher_dashboard.no_pending_recs')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl text-white ${color} shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

