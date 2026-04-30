import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, Activity } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, classes: 0, matieres: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, classesRes, matieresRes] = await Promise.all([
          api.get('/accounts/utilisateurs/'),
          api.get('/academics/classes/'),
          api.get('/academics/matieres/'),
        ]);
        
        const usersCount = usersRes.data.count ?? usersRes.data.length ?? 0;
        const classesCount = classesRes.data.count ?? classesRes.data.length ?? 0;
        const matieresCount = matieresRes.data.count ?? matieresRes.data.length ?? 0;

        setStats({
          users: usersCount,
          classes: classesCount,
          matieres: matieresCount
        });
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vue d'ensemble</h1>
        <p className="text-slate-500 mt-1">Bienvenue dans votre centre d'administration EduConnect.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Utilisateurs" value={stats.users} icon={Users} color="bg-blue-500" />
        <StatCard title="Classes" value={stats.classes} icon={GraduationCap} color="bg-emerald-500" />
        <StatCard title="Matières" value={stats.matieres} icon={BookOpen} color="bg-indigo-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Activité Récente</h2>
        </div>
        <div className="text-center py-12 text-slate-500 text-sm">
          Aucune activité récente à afficher.
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
