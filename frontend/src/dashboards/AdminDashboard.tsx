import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Activity, AlertCircle, MessageSquare, Bell, UserCheck, School, FileText } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    users: 0, 
    classes: 0, 
    matieres: 0,
    absencesToday: 0,
    pendingReclamations: 0,
    teachers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

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
        const [usersRes, classesRes, matieresRes, absencesRes, reclamationsRes, teachersRes, notifsRes] = await Promise.all([
          api.get('/accounts/utilisateurs/'),
          api.get('/academics/classes/'),
          api.get('/academics/matieres/'),
          api.get('/academics/absences/'),
          api.get('/communication/reclamations/'),
          api.get('/accounts/enseignants/'),
          api.get('/communication/notifications/')
        ]);
        
        const usersCount = usersRes.data.count ?? usersRes.data.length ?? 0;
        const classesCount = classesRes.data.count ?? classesRes.data.length ?? 0;
        const matieresCount = matieresRes.data.count ?? matieresRes.data.length ?? 0;
        const teachersCount = teachersRes.data.count ?? teachersRes.data.length ?? 0;
        
        const today = new Date().toISOString().split('T')[0];
        const absencesToday = (absencesRes.data.results || absencesRes.data).filter((a: any) => a.date === today).length;
        const pendingReclamations = (reclamationsRes.data.results || reclamationsRes.data).filter((r: any) => r.statut === 'en_attente').length;

        setStats({
          users: usersCount,
          classes: classesCount,
          matieres: matieresCount,
          teachers: teachersCount,
          absencesToday,
          pendingReclamations
        });

        // Normalize notifications for field transition
        const rawNotifs = notifsRes.data.results || notifsRes.data;
        const normalizedNotifs = Array.isArray(rawNotifs) ? rawNotifs.map((n: any) => ({
          ...n,
          is_read: n.is_read !== undefined ? n.is_read : (n.est_lu !== undefined ? n.est_lu : false),
          created_at: n.created_at || n.date_envoi
        })) : [];

        setRecentNotifications(normalizedNotifs.slice(0, 5));

      } catch (error) {
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Vue d'ensemble</h1>
          <p className="text-slate-500 mt-1 font-medium">Bienvenue dans votre centre d'administration EduConnect.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Système en ligne</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Utilisateurs" value={stats.users} icon={Users} color="bg-blue-600" trend="+2 cette semaine" />
        <StatCard title="Enseignants" value={stats.teachers} icon={UserCheck} color="bg-indigo-600" />
        <StatCard title="Absences Aujourd'hui" value={stats.absencesToday} icon={AlertCircle} color="bg-rose-600" />
        <StatCard title="Réclamations en attente" value={stats.pendingReclamations} icon={MessageSquare} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Bell className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Notifications Récentes</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentNotifications.length > 0 ? recentNotifications.map((notif, idx) => (
              <div 
                key={idx} 
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                  notif.is_read 
                    ? 'bg-slate-50 border-slate-100 opacity-60' 
                    : 'bg-white border-indigo-100 shadow-sm border-l-4 border-l-indigo-500 cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    notif.is_read ? 'bg-slate-100 text-slate-400' : 
                    notif.type === 'absence' ? 'bg-red-50 text-red-600' :
                    notif.type === 'note' ? 'bg-green-50 text-green-600' :
                    notif.type === 'reclamation' ? 'bg-amber-50 text-amber-600' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {notif.type === 'absence' ? <AlertCircle className="w-5 h-5" /> : 
                     notif.type === 'note' ? <FileText className="w-5 h-5" /> :
                     notif.type === 'reclamation' ? <MessageSquare className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-bold leading-none ${notif.is_read ? 'text-slate-500' : 'text-slate-900'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!notif.is_read && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-full uppercase animate-pulse">
                    Nouveau
                  </span>
                )}
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-medium italic">
                Aucune notification récente à afficher.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-8">Raccourcis</h2>
          <div className="grid grid-cols-1 gap-3">
            <ShortcutButton icon={School} label="Gérer les Classes" color="text-blue-600" bg="bg-blue-50" to="/dashboard/admin/classes" />
            <ShortcutButton icon={Users} label="Gérer les Utilisateurs" color="text-indigo-600" bg="bg-indigo-50" to="/dashboard/admin/users" />
            <ShortcutButton icon={GraduationCap} label="Liste des Étudiants" color="text-emerald-600" bg="bg-emerald-50" to="/dashboard/admin/students" />
            <ShortcutButton icon={FileText} label="Évaluations" color="text-amber-600" bg="bg-amber-50" to="/dashboard/admin/evaluations" />
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
        {trend && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">{trend}</span>}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
      </div>
    </div>
  );
}

function ShortcutButton({ icon: Icon, label, color, bg, to }: { icon: any, label: string, color: string, bg: string, to: string }) {
  return (
    <Link to={to} className={`flex items-center gap-4 p-4 rounded-2xl ${bg} ${color} font-bold text-sm hover:scale-[1.02] transition-transform duration-200 text-left w-full`}>
      <div className="p-2 bg-white rounded-xl shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      {label}
    </Link>
  );
}
