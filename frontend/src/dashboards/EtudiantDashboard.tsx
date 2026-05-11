import { useEffect, useState } from 'react';
import { Clock, MessageSquare, Activity, BookOpen, TrendingUp,Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
        
        // Auto-select active period if none selected
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
        const currentBulletin = myBulletins.find((b: any) => 
          b.periode?.toString() === selectedPeriode || b.periode?.id?.toString() === selectedPeriode
        );

        setStats({
          average: currentBulletin ? parseFloat(currentBulletin.moyenne) : 0,
          absences: myAbsences.length,
          matieres: matieresRes.data.count || matieresRes.data.length || 0
        });

        setRecentNotes(myNotes.slice(0, 5));
        
        // Normalize notifications
        const rawNotifs = notificationsRes.data.results || notificationsRes.data;
        const normalizedNotifs = Array.isArray(rawNotifs) ? rawNotifs.map((n: DashboardNotification) => ({
          ...n,
          is_read: n.is_read !== undefined ? n.is_read : (n.est_lu !== undefined ? n.est_lu : false),
          created_at: n.created_at || n.date_envoi || new Date().toISOString()
        })) : [];
        
        setRecentNotifications(normalizedNotifs.slice(0, 5));

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('student_dashboard.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('student_dashboard.welcome', { name: user?.first_name })}</p>
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select 
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm transition-all"
          >
            <option value="">{t('student_dashboard.period_selector')}</option>
            {periodes.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title={t('student_dashboard.stats.average')} 
          value={stats.average > 0 ? stats.average.toFixed(2) : t('student_dashboard.stats.not_available')} 
          icon={TrendingUp} 
          color="bg-indigo-600" 
          trend={stats.average >= 10 ? "Satisfaisant" : "À améliorer"}
        />
        <StatCard title={t('student_dashboard.stats.absences')} value={stats.absences} icon={Activity} color="bg-rose-500" />
        <StatCard title={t('student_dashboard.stats.matieres')} value={stats.matieres} icon={BookOpen} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t('student_dashboard.recent_notes')}</h3>
            </div>
            <Link to="/student/grades" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">{t('teacher_dashboard.view_all')}</Link>
          </div>

          <div className="space-y-4">
            {recentNotes.length > 0 ? recentNotes.map((note, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{note.evaluation_details?.matiere_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{note.evaluation_details?.type_display} • {note.evaluation_details?.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  {note.est_absent ? (
                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest">{t('parent_notes.table.absent')}</span>
                  ) : (
                    <span className={`text-lg font-black ${note.valeur_note && note.valeur_note >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {note.valeur_note}/20
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 italic text-sm">{t('student_dashboard.no_recent_notes')}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t('student_dashboard.notifications')}</h3>
            </div>
            <Link to="/student/notifications" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">{t('teacher_dashboard.view_all')}</Link>
          </div>

          <div className="space-y-4">
            {recentNotifications.length > 0 ? recentNotifications.map((notif, idx) => (
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
              <div className="text-center py-8 text-slate-400 italic text-sm">{t('student_dashboard.no_notifs')}</div>
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
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            value === "N/A" ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'
          }`}>
            {value === "N/A" ? "En attente" : trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

