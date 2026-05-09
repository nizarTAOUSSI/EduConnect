import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import TimetableGrid from '../../components/TimetableGrid';
import toast from 'react-hot-toast';

export default function StudentTimetable() {
  const [classeId, setClasseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        setLoading(true);
        const userRes = await api.get('/accounts/auth/me/');
        const user = userRes.data;
        
        const studentRes = await api.get(`/accounts/etudiants/?utilisateur=${user.id}`);
        const studentData = studentRes.data.results || studentRes.data;
        const student = Array.isArray(studentData) ? studentData[0] : studentData;
        
        if (student && student.classe) {
          setClasseId(student.classe);
        }
      } catch (error) {
        toast.error('Erreur lors du chargement de votre profil');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentProfile();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mon Emploi du Temps</h1>
        <p className="text-slate-500 mt-1">Consultez votre emploi du temps hebdomadaire.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        {classeId ? (
          <TimetableGrid classeId={classeId} />
        ) : (
          <div className="text-center py-20 text-slate-400">
            Vous n'êtes affecté à aucune classe pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
