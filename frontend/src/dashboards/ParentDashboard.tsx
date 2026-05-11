import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, FileSpreadsheet, Clock, MessageSquare, Activity, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';

interface DashboardActivity {
  title: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
  timestamp: number;
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

export default function ParentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enfants: 0,
    reclamations: 0,
    absences: 0
  });
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [periodes, setPeriodes] = useState<DashboardPeriode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/communication/notifications/${notificationId}/`, { is_read: true });
      setNotifications(prev => prev.map(notif =>
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
        setLoading(true);
        const [parentsRes, reclamationsRes, absencesRes, notesRes, notifsRes, periodsRes] = await Promise.all([
          api.get('/accounts/parents/'),
          api.get('/communication/reclamations/'),
          api.get('/academics/absences/'),
          api.get('/grades/notes/'),
          api.get('/communication/notifications/'),
          api.get('/academics/periodes/')
        ]);

        const allPeriods = periodsRes.data.results || periodsRes.data;
        setPeriodes(allPeriods);

        if (!selectedPeriode && allPeriods.length > 0) {
          const active = allPeriods.find((p: DashboardPeriode) => p.est_active);
          if (active) setSelectedPeriode(active.id.toString());
          else setSelectedPeriode(allPeriods[0].id.toString());
        }

        const parentsData = Array.isArray(parentsRes.data) ? parentsRes.data : (parentsRes.data.results || [parentsRes.data]);
        const myProfile = parentsData.find((p: { utilisateur: number | { id: number } }) => {
          const pUserId = typeof p.utilisateur === 'object' ? p.utilisateur.id : p.utilisateur;
          return pUserId === user?.id;
        });

        // Normalize notifications for field transition
        const rawNotifs = notifsRes.data.results || notifsRes.data;
        const normalizedNotifs = Array.isArray(rawNotifs) ? rawNotifs.map((n: DashboardNotification) => ({
          ...n,
          is_read: n.is_read !== undefined ? n.is_read : (n.est_lu !== undefined ? n.est_lu : false),
          created_at: n.created_at || n.date_envoi || new Date().toISOString()
        })) : [];

        setNotifications(normalizedNotifs.slice(0, 5));

        if (myProfile && myProfile.enfants) {
          const enfantIds = myProfile.enfants;
          // Get User IDs of children for reclamations
          const enfantUserIds = myProfile.enfants_details?.map((e: { utilisateur: number }) => e.utilisateur) || [];
          
          const myChildrenAbsences = (absencesRes.data.results || absencesRes.data).filter(
            (a: { etudiant: number }) => enfantIds.includes(a.etudiant)
          );
          
          const myChildrenRecs = (reclamationsRes.data.results || reclamationsRes.data).filter(
            (r: { expediteur: number }) => enfantUserIds.includes(r.expediteur)
          );

          const myChildrenNotes = (notesRes.data.results || notesRes.data).filter(
            (n: { etudiant: number }) => enfantIds.includes(n.etudiant)
          ).filter((n: { evaluation_details?: { periode?: number } }) => {
            if (!selectedPeriode) return true;
            const periodId = n.evaluation_details?.periode;
            return periodId?.toString() === selectedPeriode;
          });

          setStats({
            enfants: enfantIds.length,
            reclamations: myChildrenRecs.length,
            absences: myChildrenAbsences.length
          });

          // Recent activity (Notes and Absences only)
          const recentAbs = myChildrenAbsences.slice(0, 3).map((a: { etudiant_details?: { first_name: string }, enseignant_matiere_details?: { matiere_name: string }, date: string }) => ({
            title: `Absence: ${a.etudiant_details?.first_name}`,
            desc: `${a.enseignant_matiere_details?.matiere_name} - ${a.date}`,
            icon: Clock,
            color: 'text-rose-500',
            bg: 'bg-rose-50',
            timestamp: new Date(a.date).getTime()
          }));

          const recentNotes = myChildrenNotes.slice(0, 3).map((n: { etudiant_details?: { first_name: string }, evaluation_details?: { matiere_name: string, date: string }, valeur_note: number }) => ({
            title: `Note: ${n.etudiant_details?.first_name}`,
            desc: `${n.evaluation_details?.matiere_name}: ${n.valeur_note}/20`,
            icon: FileSpreadsheet,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            timestamp: new Date(n.evaluation_details?.date || Date.now()).getTime()
          }));

          const combined = [...recentAbs, ...recentNotes]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 6);

          setRecentActivities(combined);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques", error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchStats();
  }, [user, selectedPeriode]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('parent_dashboard.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">
            {t('parent_dashboard.welcome', { name: user?.first_name })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Clock className="w-5 h-5 text-indigo-600 ml-2" />
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
        <StatCard title={t('parent_dashboard.stats.children')} value={stats.enfants} icon={Users} color="bg-blue-600" />
        <StatCard title={t('parent_dashboard.stats.reclamations')} value={stats.reclamations} icon={MessageSquare} color="bg-amber-600" />
        <StatCard title={t('parent_dashboard.stats.absences')} value={stats.absences} icon={Clock} color="bg-rose-600" trend={stats.absences > 0 ? "À suivre" : "RAS"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('parent_dashboard.recent_activities')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentActivities.length > 0 ? recentActivities.map((act, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${act.bg} ${act.color} flex items-center justify-center shrink-0`}>
                  <act.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{act.title}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{act.desc}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12 text-slate-400 font-medium italic">
                {t('parent_dashboard.no_activities')}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('parent_dashboard.notifications')}</h2>
          </div>
          <div className="space-y-4">
            {notifications.length > 0 ? notifications.map((notif, idx) => (
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
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm leading-snug truncate ${notif.is_read ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>{notif.message}</p>
                    {!notif.is_read && <span className="px-2 py-0.5 bg-purple-600 text-[8px] font-black text-white rounded-full uppercase animate-pulse shrink-0">Nouveau</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">{new Date(notif.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-2xl">
                {t('parent_dashboard.no_notifs')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: { title: string, value: number | string, icon: any, color: string, trend?: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group border-b-4 border-b-transparent hover:border-b-indigo-500">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${trend === 'RAS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{trend}</span>}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
      </div>
    </div>
  );
}

