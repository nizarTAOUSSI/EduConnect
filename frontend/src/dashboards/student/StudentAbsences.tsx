import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function StudentAbsences() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAbsences = async () => {
      try {
        setLoading(true);
        const etudiantsRes = await api.get('/accounts/etudiants/');
        const etudiantsData = etudiantsRes.data.results || etudiantsRes.data;
        const myProfile = etudiantsData.find((e: any) => e.utilisateur === user?.id);

        if (myProfile) {
          const response = await api.get(`/academics/absences/?etudiant=${myProfile.id}`);
          setAbsences(response.data.results || response.data);
        }
      } catch (error) {
        toast.error(t('student_absences.messages.load_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchMyAbsences();
  }, [user, t]);

  const justifiedCount = absences.filter(a => a.justifiee).length;
  const unjustifiedCount = absences.length - justifiedCount;

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('student_absences.title')}</h1>
          <p className="text-slate-500 mt-1">{t('student_absences.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">{unjustifiedCount}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{t('student_absences.stats.unjustified')}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">{justifiedCount}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{t('student_absences.stats.justified')}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">{absences.length > 0 ? '95%' : '100%'}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{t('student_absences.stats.presence_rate')}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            {t('student_absences.history_title')}
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {absences.length > 0 ? absences.map((abs, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-8 hover:bg-slate-50/50 transition-colors gap-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{t('student_absences.table.date')}</span>
                  <span className="text-sm font-black text-slate-900">{abs.date}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-slate-900">
                      {abs.enseignant_matiere_details?.matiere_name || `Cours #${abs.enseignant_matiere}`}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {abs.seance_details ? (
                        <span className="font-medium text-slate-700">
                          {abs.seance_details.heure_debut} - {abs.seance_details.heure_fin}
                        </span>
                      ) : (
                        <span>{t('student_absences.table.duration', { count: abs.duree_heures })}</span>
                      )}
                    </p>
                    {abs.enseignant_matiere_details?.enseignant_name && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        {abs.enseignant_matiere_details.enseignant_name}
                      </p>
                    )}
                    {abs.motif && (
                      <p className="text-sm text-slate-400 italic">
                        "{abs.motif}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${abs.justifiee ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {abs.justifiee ? t('student_absences.table.justified') : t('student_absences.table.unjustified')}
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-slate-400 italic">
              {t('student_absences.messages.no_absences')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
