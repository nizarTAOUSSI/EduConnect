import { useEffect, useState } from 'react';
import { FileSpreadsheet, TrendingUp, BookOpen, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function StudentNotes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ moyenne: 0, max: 0, min: 0 });
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('all');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchMyNotes = async () => {
      try {
        setLoading(true);

        const [notesRes, periodsRes] = await Promise.all([
          api.get('/grades/notes/'),
          api.get('/academics/periodes/')
        ]);

        const allData = notesRes.data.results || notesRes.data;
        let myData = allData.filter((n: any) => n.etudiant_user === user?.id);

        const allPeriods = periodsRes.data.results || periodsRes.data;
        setPeriodes(allPeriods);

        if (selectedPeriode !== 'all') {
          myData = myData.filter((n: any) => n.evaluation_details?.periode?.toString() === selectedPeriode || n.evaluation_details?.periode?.id?.toString() === selectedPeriode);
        }

        setNotes(myData);

        if (myData.length > 0) {
          const values = myData.map((n: any) => n.valeur_note || 0);
          
          // Calculate weighted average
          const weightedSum = myData.reduce((sum: number, n: any) => {
            const val = n.est_absent ? 0 : (n.valeur_note || 0);
            const coeff = n.evaluation_details?.matiere_coefficient || 1;
            return sum + (val * coeff);
          }, 0);
          
          const totalCoeff = myData.reduce((sum: number, n: any) => {
            return sum + (n.evaluation_details?.matiere_coefficient || 1);
          }, 0);

          setStats({
            moyenne: Number((weightedSum / totalCoeff).toFixed(2)),
            max: Math.max(...values),
            min: Math.min(...values)
          });
        } else {
          setStats({ moyenne: 0, max: 0, min: 0 });
        }
      } catch (error) {
        toast.error(t('student_notes.messages.load_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchMyNotes();
  }, [user, selectedPeriode, t]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  const filteredNotes = notes.filter(n => {
    const s = searchTerm.toLowerCase();
    const matchesText = (n.evaluation_details?.matiere_name || '').toLowerCase().includes(s) || 
                        (n.commentaire || '').toLowerCase().includes(s);
    const matchesType = typeFilter === 'all' || n.evaluation_details?.type === typeFilter;
    return matchesText && matchesType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('student_notes.title')}</h1>
          <p className="text-slate-500 mt-1">{t('student_notes.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
          <p className="text-indigo-100 text-sm font-medium">{t('student_notes.stats.average')}</p>
          <p className="text-3xl font-black mt-1">{stats.moyenne}<span className="text-lg font-normal opacity-70">/20</span></p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" />
            {t('student_notes.stats.current_performance')}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">{t('student_notes.stats.best')}</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.max}<span className="text-lg font-normal text-slate-400">/20</span></p>
          <p className="text-xs font-bold text-emerald-500 mt-2 uppercase tracking-wider">{t('student_notes.stats.excellent')}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">{t('student_notes.stats.min')}</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.min}<span className="text-lg font-normal text-slate-400">/20</span></p>
          <p className="text-xs font-bold text-amber-500 mt-2 uppercase tracking-wider">{t('student_notes.stats.to_improve')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('student_notes.filters.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">{t('student_notes.filters.all_periods')}</option>
            {periodes.map(p => (
              <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
          >
            <option value="all">{t('student_notes.filters.all_types')}</option>
            <option value="CC">{t('evaluations_manager.types.CC')}</option>
            <option value="Examen">{t('evaluations_manager.types.Examen')}</option>
            <option value="TP">{t('evaluations_manager.types.TP')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('student_notes.table.subject_type')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('student_notes.table.teacher')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('student_notes.table.grade')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('student_notes.table.comment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotes.length > 0 ? filteredNotes.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 block leading-none mb-1">
                          {row.evaluation_details?.matiere_name || 'Matière'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {row.evaluation_details?.type_display} • {row.evaluation_details?.date} • Coeff: {row.evaluation_details?.matiere_coefficient}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600">
                      {row.evaluation_details?.enseignant_name || 'Professeur'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className={`text-lg font-black ${row.est_absent ? 'text-rose-500' : 'text-indigo-600'}`}>
                        {row.est_absent ? t('common.absent') : `${row.valeur_note}/20`}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-md">
                      <p className="text-sm text-slate-500 italic leading-relaxed">
                        {row.commentaire ? `"${row.commentaire}"` : t('student_notes.table.no_comment')}
                      </p>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    {t('student_notes.messages.no_results')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}