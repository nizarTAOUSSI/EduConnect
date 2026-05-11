import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, MessageSquare, Activity, BookOpen, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';

interface DashboardNote {
  id: number;
  valeur_note: number | null;
  est_absent: boolean;
  created_at: string;
  evaluation_details?: {
    matiere_name: string;
    matiere_coefficient: number;
    type_display: string;
    date: string;
    periode?: number;
  };
}

interface DashboardNotification {
  id: number;
  message: string;
  is_read: boolean;
  est_lu?: boolean;
  created_at: string;
  date_envoi?: string;
}

interface DashboardPeriode {
  id: number;
  nom: string;
  code: string;
  est_active: boolean;
}

export default function EtudiantDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    average: 0,
    absences: 0,
    matieres: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentNotes, setRecentNotes] = useState<DashboardNote[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<DashboardNotification[]>([]);
  const [periodes, setPeriodes] = useState<DashboardPeriode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/communication/notifications/${notificationId}/`, { is_read: true });
      setRecentNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      // Dispatch event to update sidebar counts
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification', error);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user) return;
        
        const [notesRes, absencesRes, matieresRes, notificationsRes, bulletinsRes, periodsRes] = await Promise.all([
          api.get('/grades/notes/'),
          api.get('/academics/absences/'),
          api.get('/academics/matieres/'),
          api.get('/communication/notifications/'),
          api.get('/reports/bulletins/'),
          api.get('/academics/periodes/')
        ]);

        const allPeriods = periodsRes.data.results || periodsRes.data;
        setPeriodes(allPeriods);
        
        if (!selectedPeriode && allPeriods.length > 0) {
          const active = allPeriods.find((p: DashboardPeriode) => p.est_active);
          if (active) setSelectedPeriode(active.id.toString());
          else setSelectedPeriode(allPeriods[0].id.toString());
        }

        const allNotes = notesRes.data.results || notesRes.data;
        let myNotes = allNotes.filter((n: DashboardNote & { etudiant_user: number }) => n.etudiant_user === user.id);
        
        if (selectedPeriode) {
          myNotes = myNotes.filter((n: DashboardNote) => {
            const periodId = n.evaluation_details?.periode;
            return periodId?.toString() === selectedPeriode;
          });
        }

        const allAbsences = absencesRes.data.results || absencesRes.data;
        const myAbsences = allAbsences.filter((a: { etudiant_user: number }) => a.etudiant_user === user.id);

        const myBulletins = bulletinsRes.data.results || bulletinsRes.data;
        const latestBulletin = selectedPeriode 
          ? myBulletins.find((b: { periode: number | { id: number } }) => {
              const bPeriodId = typeof b.periode === 'object' ? b.periode.id : b.periode;
              return bPeriodId?.toString() === selectedPeriode;
            })
          : myBulletins[0];

        const rawNotifs = notificationsRes.data.results || notificationsRes.data;
        const normalizedNotifs = Array.isArray(rawNotifs) ? rawNotifs.map((n: DashboardNotification) => ({
          ...n,
          is_read: n.is_read !== undefined ? n.is_read : (n.est_lu !== undefined ? n.est_lu : false),
          created_at: n.created_at || n.date_envoi || new Date().toISOString()
        })) : [];

        const realAverage = latestBulletin?.moyenne_generale || (myNotes.length > 0 ? (myNotes.reduce((acc: number, n: DashboardNote) => acc + (n.valeur_note || 0), 0) / myNotes.length) : 0);

        setStats({
          average: realAverage,
          absences: myAbsences.length,
          matieres: matieresRes.data.count || matieresRes.data.length || 0
        });

        const sortedNotes = myNotes.sort((a: DashboardNote, b: DashboardNote) => {
          const dateA = new Date(a.evaluation_details?.date || 0).getTime();
          const dateB = new Date(b.evaluation_details?.date || 0).getTime();
          if (dateA !== dateB) return dateB - dateA;
          const createA = new Date(a.created_at || 0).getTime();
          const createB = new Date(b.created_at || 0).getTime();
          return createB - createA;
        });

        setRecentNotes(sortedNotes.slice(0, 4));
        setRecentNotifications(normalizedNotifs.slice(0, 4));

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, selectedPeriode]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('student_dashboard.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">
            {t('student_dashboard.welcome', { name: user?.first_name })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Calendar className="w-5 h-5 text-indigo-600 ml-2" />
          <select 
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="bg-transparent border-none focus:ring-0 font-bold text-slate-700 pr-8"
          >
            {periodes.map(p => (
              <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title={t('student_dashboard.stats.average')} value={stats.average.toFixed(2)} icon={TrendingUp} color="bg-blue-600" unit="/20" />
        <StatCard title={t('student_dashboard.stats.absences')} value={stats.absences} icon={Clock} color="bg-rose-600" trend={stats.absences > 3 ? "Attention" : "Bon état"} />
        <StatCard title={t('student_dashboard.stats.matieres')} value={stats.matieres} icon={BookOpen} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('student_dashboard.recent_notes')}</h2>
          </div>
          <div className="space-y-4">
            {recentNotes.length > 0 ? recentNotes.map((note, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 hover:bg-white transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-bold shadow-sm">
                    {note.valeur_note}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{note.evaluation_details?.matiere_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{note.evaluation_details?.type_display} • Coeff: {note.evaluation_details?.matiere_coefficient}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{note.evaluation_details?.date ? new Date(note.evaluation_details.date).toLocaleDateString() : ''}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-medium italic">
                {t('student_dashboard.no_recent_notes')}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{t('student_dashboard.notifications')}</h2>
            </div>
          </div>
          <div className="space-y-4">
            {recentNotifications.length > 0 ? recentNotifications.map((notif, idx) => (
              <div 
                key={idx} 
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  notif.is_read 
                    ? 'bg-slate-50 border-slate-100 opacity-70' 
                    : 'bg-white border-purple-100 shadow-sm border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${notif.is_read ? 'bg-slate-200 text-slate-400' : 'bg-purple-100 text-purple-600'}`}>
                  {notif.is_read ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.is_read ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>{notif.message}</p>
                    {!notif.is_read && <span className="px-2 py-0.5 bg-purple-600 text-[8px] font-black text-white rounded-full uppercase animate-pulse shrink-0">Nouveau</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">{new Date(notif.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-medium italic">
                {t('student_dashboard.no_notifs')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, unit, trend }: { title: string, value: string | number, icon: any, color: string, unit?: string, trend?: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group border-b-4 border-b-transparent hover:border-b-indigo-500">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${trend === 'Attention' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{trend}</span>}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
          {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
      </div>
    </div>
  );
}

