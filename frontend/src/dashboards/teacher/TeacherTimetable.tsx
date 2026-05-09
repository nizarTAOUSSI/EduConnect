import { useState, useEffect } from 'react';
import { School, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import TimetableGrid from '../../components/TimetableGrid';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function TeacherTimetable() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | string>('');
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'class' | 'personal'>('personal');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch teacher profile
        const teacherRes = await api.get(`/accounts/enseignants/?utilisateur=${user.id}`);
        const teacherData = teacherRes.data.results || teacherRes.data;
        const teacher = Array.isArray(teacherData) ? teacherData[0] : teacherData;
        
        if (teacher) {
          setTeacherId(teacher.id);
          
          // Fetch assignments to get classes
          const assignRes = await api.get(`/academics/enseignant-matieres/?enseignant=${teacher.id}`);
          const assignments = assignRes.data.results || assignRes.data;
          
          const classIds = [...new Set(assignments.map((a: any) => a.classe))];
          
          if (classIds.length > 0) {
            const classPromises = classIds.map(id => api.get(`/academics/classes/${id}/`));
            const classRes = await Promise.all(classPromises);
            const teacherClasses = classRes.map(r => r.data);
            
            setClasses(teacherClasses);
            if (teacherClasses.length > 0) {
              setSelectedClassId(teacherClasses[0].id);
            }
          }
        } else {
          toast.error('Profil enseignant non trouvé');
        }
      } catch (error) {
        console.error(error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner className="text-emerald-600 w-10 h-10" />
        <p className="text-slate-500 font-medium animate-pulse">Chargement de l'emploi du temps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Emploi du Temps</h1>
          <p className="text-slate-500 mt-1">Consultez votre emploi du temps personnel ou celui des classes.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setView('personal')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              view === 'personal' 
                ? 'bg-white text-emerald-600 shadow-md transform scale-105' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Mon Emploi
          </button>
          <button
            onClick={() => setView('class')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              view === 'class' 
                ? 'bg-white text-emerald-600 shadow-md transform scale-105' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <School className="w-4 h-4" />
            Par Classe
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm overflow-hidden relative">
        {view === 'class' && (
          <div className="flex flex-col sm:flex-row items-end gap-6 mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2 flex-1 max-w-xs">
              <label className="text-sm font-bold text-slate-700 ml-1">Sélectionner une classe</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200 appearance-none font-medium text-slate-700 shadow-sm"
                >
                  {classes.length > 0 ? (
                    classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
                    ))
                  ) : (
                    <option value="">Aucune classe</option>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="transition-all duration-500">
          {view === 'personal' ? (
            <TimetableGrid isTeacherGlobal={true} />
          ) : selectedClassId ? (
            <TimetableGrid 
              classeId={selectedClassId} 
              currentTeacherId={teacherId || undefined} 
            />
          ) : (
            <div className="text-center py-20 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Aucune classe affectée à votre profil.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
