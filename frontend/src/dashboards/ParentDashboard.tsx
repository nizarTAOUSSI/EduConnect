import { useEffect, useState } from 'react';
import { Users, FileSpreadsheet, Clock, MessageSquare, Activity, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import { useTranslation } from 'react-i18next';

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
  // const [periodes, setPeriodes] = useState<DashboardPeriode[]>([]);
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
        // setPeriodes(allPeriods);

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
          
          const myReclamations = (reclamationsRes.data.results || reclamationsRes.data).filter(
            (r: any) => enfantUserIds.includes(r.expediteur) || r.destinataire === user?.id
          );

          const myAbsences = (absencesRes.data.results || absencesRes.data).filter(
            (a: any) => enfantIds.includes(a.etudiant)
          );

          const myNotes = (notesRes.data.results || notesRes.data).filter(
            (n: any) => enfantIds.includes(n.etudiant)
          );

          setStats({
            enfants: enfantIds.length,
            reclamations: myReclamations.length,
            absences: myAbsences.length
          });

          // Build Recent Activities
          const activities: DashboardActivity[] = [];
          
          myNotes.slice(0, 3).forEach((n: any) => {
            const child = myProfile.enfants_details?.find((e: any) => e.id === n.etudiant);
            activities.push({
              title: t('parent_dashboard.activity_types.grade', { name: child?.first_name || 'Enfant' }),
              desc: `${n.evaluation_details?.matiere_name}: ${n.valeur_note}/20`,
              icon: FileSpreadsheet,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              timestamp: new Date(n.created_at).getTime()
            });
          });

          myAbsences.slice(0, 3).forEach((a: any) => {
            const child = myProfile.enfants_details?.find((e: any) => e.id === a.etudiant);
            activities.push({
              title: t('parent_dashboard.activity_types.absence', { name: child?.first_name || 'Enfant' }),
              desc: `${a.enseignant_matiere_details?.matiere_name} - ${a.date}`,
              icon: Clock,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
              timestamp: new Date(a.date).getTime()
            });
          });

          setRecentActivities(activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchStats();
  }, [user, selectedPeriode, t]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('parent_dashboard.title')}</h1>
        <p className="text-slate-500 mt-1 font-medium">{t('parent_dashboard.welcome', { name: user?.first_name })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title={t('parent_dashboard.stats.children')} value={stats.enfants} icon={Users} color="bg-indigo-600" />
        <StatCard title={t('parent_dashboard.stats.reclamations')} value={stats.reclamations} icon={MessageSquare} color="bg-amber-500" />
        <StatCard title={t('parent_dashboard.stats.absences')} value={stats.absences} icon={Activity} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t('parent_dashboard.recent_activities')}</h3>
            </div>
          </div>

          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`w-10 h-10 rounded-xl ${act.bg} ${act.color} flex items-center justify-center shrink-0`}>
                  <act.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-none">{act.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{act.desc}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 italic text-sm">{t('parent_dashboard.no_activities')}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t('parent_dashboard.notifications')}</h3>
            </div>
          </div>

          <div className="space-y-4">
            {notifications.length > 0 ? notifications.map((notif, idx) => (
              <div 
                key={idx} 
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.is_read 
                    ? 'bg-slate-50 border-slate-100 opacity-60' 
                    : 'bg-white border-amber-200 shadow-md shadow-amber-50 ring-1 ring-amber-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse" />}
                  <div className="flex-1">
                    <p className={`text-xs leading-relaxed ${notif.is_read ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>{notif.message}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{new Date(notif.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 italic text-sm">{t('parent_dashboard.no_notifs')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
      <div className="mb-6">
        <div className={`p-3 w-fit rounded-2xl text-white ${color} shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

