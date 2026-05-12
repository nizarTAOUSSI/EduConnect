import { useEffect, useState } from 'react';
import { FileSpreadsheet, TrendingUp, BookOpen, Search, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const getAnneeId = (value: any): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'id' in value) return value.id;
  return null;
};

export default function StudentNotes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ moyenne: 0, max: 0, min: 0 });
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [etudiantId, setEtudiantId] = useState<number | null>(null);
  const [classeId, setClasseId] = useState<number | null>(null);
  const [evaluationsComplete, setEvaluationsComplete] = useState<boolean | null>(null);
  const [bulletin, setBulletin] = useState<any>(null);
  const [loadingBulletin, setLoadingBulletin] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setStatusFilter] = useState('all');

  const checkEvaluationsComplete = async () => {
    if (!classeId || !selectedPeriode || !etudiantId) return;
    try {
      const res = await api.get('/reports/bulletins/check-evaluations-complete/', {
        params: { classe_id: classeId, periode_id: selectedPeriode, etudiant_id: etudiantId }
      });
      setEvaluationsComplete(res.data.complete);
    } catch (error) {
      setEvaluationsComplete(false);
    }
  };

  const fetchBulletin = async () => {
    if (!etudiantId || !selectedPeriode) return;
    try {
      setLoadingBulletin(true);
      const res = await api.get(`/reports/bulletins/?etudiant=${etudiantId}&periode=${selectedPeriode}`);
      const bulletins = res.data.results || res.data;
      if (bulletins.length > 0) {
        const details = await api.get(`/reports/bulletins/${bulletins[0].id}/`);
        setBulletin(details.data);
      } else {
        // No bulletin exists, create it automatically
        const createRes = await api.post('/reports/bulletins/', {
          etudiant: etudiantId,
          periode: parseInt(selectedPeriode),
          moyenne_generale: 0 // Will be calculated automatically
        });
        const details = await api.get(`/reports/bulletins/${createRes.data.id}/`);
        setBulletin(details.data);
      }
    } catch (error) {
      console.error('Error fetching/creating bulletin:', error);
      setBulletin(null);
    } finally {
      setLoadingBulletin(false);
    }
  };

  const downloadBulletinPDF = async () => {
    if (!bulletin) return;
    try {
      const response = await api.get(`/reports/bulletins/${bulletin.id}/pdf/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bulletin_${bulletin.etudiant}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Bulletin téléchargé avec succès');
    } catch (error) {
      toast.error('Erreur lors du téléchargement du bulletin');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [etudiantsRes, notesRes, periodsRes, anneeRes] = await Promise.all([
          api.get('/accounts/etudiants/'),
          api.get('/grades/notes/'),
          api.get('/academics/periodes/'),
          api.get('/academics/annees-scolaires/'),
        ]);

        const etudiantsData = etudiantsRes.data.results || etudiantsRes.data;
        const myProfile = etudiantsData.find((e: any) => e.utilisateur === user?.id);
        if (myProfile) {
          setEtudiantId(myProfile.id);
          setClasseId(myProfile.classe);
        }

        const allData = notesRes.data.results || notesRes.data;
        let myData = allData.filter((n: any) => n.etudiant_user === user?.id);

        const allPeriods = periodsRes.data.results || periodsRes.data;
        const allAnnees = anneeRes.data.results || anneeRes.data;

        const activeAnnee = allAnnees.find((a: any) => a.est_active);
        const filteredPeriodes = activeAnnee 
          ? allPeriods.filter((p: any) => getAnneeId(p.annee_scolaire) === activeAnnee.id)
          : allPeriods;
        setPeriodes(filteredPeriodes);

        const activePeriode = filteredPeriodes.find((p: any) => p.est_active);
        if (activePeriode && !selectedPeriode) {
          setSelectedPeriode(activePeriode.id.toString());
        }

        let filteredNotes = myData;
        if (selectedPeriode) {
          filteredNotes = myData.filter((n: any) => 
            n.evaluation_details?.periode?.toString() === selectedPeriode || 
            n.evaluation_details?.periode?.id?.toString() === selectedPeriode
          );
        }

        setNotes(filteredNotes);

        if (filteredNotes.length > 0) {
          const values = filteredNotes.map((n: any) => n.valeur_note || 0);
          
          // Calculate weighted average of MATIERES' AVERAGES (like database!)
          const matiereGroups: Record<string, { notes: number[]; coeff: number }> = {};
          
          filteredNotes.forEach((n: any) => {
            const matiereId = n.evaluation_details?.matiere;
            const coeff = n.evaluation_details?.matiere_coefficient || 1;
            const val = n.est_absent ? 0 : (n.valeur_note || 0);
            
            if (matiereId) {
              if (!matiereGroups[matiereId]) {
                matiereGroups[matiereId] = { notes: [], coeff };
              }
              matiereGroups[matiereId].notes.push(val);
            }
          });
          
          let totalWeightedNotes = 0;
          let totalCoefficients = 0;
          
          Object.values(matiereGroups).forEach((group) => {
            const matiereAvg = group.notes.reduce((sum, n) => sum + n, 0) / group.notes.length;
            totalWeightedNotes += matiereAvg * group.coeff;
            totalCoefficients += group.coeff;
          });
          
          const finalAverage = totalCoefficients > 0 ? (totalWeightedNotes / totalCoefficients) : 0;

          setStats({
            moyenne: Number(finalAverage.toFixed(2)),
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
    fetchData();
  }, [user, selectedPeriode, t]);

  useEffect(() => {
    checkEvaluationsComplete();
  }, [classeId, selectedPeriode, etudiantId]);

  useEffect(() => {
    if (evaluationsComplete) {
      fetchBulletin();
    } else {
      setBulletin(null);
    }
  }, [evaluationsComplete, etudiantId, selectedPeriode]);

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
            required
          >
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

      {/* Bulletin Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Bulletin de Notes
          </h3>
        </div>
        <div className="p-8">
          {evaluationsComplete === null && (
            <div className="text-center py-8 text-slate-500">
              <Spinner className="mx-auto mb-4" />
              Vérification des évaluations...
            </div>
          )}
          {evaluationsComplete === false && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-center gap-4">
              <AlertCircle className="w-10 h-10 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-bold text-amber-900">Évaluations incomplètes</h4>
                <p className="text-amber-700 text-sm">Certaines notes ne sont pas encore renseignées, le bulletin n'est pas disponible.</p>
              </div>
            </div>
          )}
          {evaluationsComplete === true && (
            <div className="space-y-6">
              {loadingBulletin ? (
                <div className="text-center py-8 text-slate-500">
                  <Spinner className="mx-auto mb-4" />
                  Chargement du bulletin...
                </div>
              ) : bulletin ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200">
                      <h4 className="font-bold text-indigo-900 mb-2">Moyenne Générale</h4>
                      <p className="text-4xl font-black text-indigo-600">{bulletin.moyenne_generale.toFixed(2)} <span className="text-lg font-normal opacity-70">/20</span></p>
                      {bulletin.mention && (
                        <p className="text-indigo-700 font-bold mt-2">Mention : {bulletin.get_mention_display || bulletin.mention}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={downloadBulletinPDF}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Télécharger le Bulletin
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Matière</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Coefficient</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Moyenne</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">État</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulletin.matieres?.map((matiere: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 font-bold text-slate-900">{matiere.nom}</td>
                            <td className="px-6 py-4 text-slate-600">{matiere.coefficient}</td>
                            <td className="px-6 py-4">
                              <span className="text-lg font-black text-indigo-600">
                                {matiere.moyenne.toFixed(2)}/20
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${matiere.etat === 'Valide' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {matiere.etat === 'Valide' ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Valide
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Non Valide
                                  </span>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <p className="text-slate-600 font-bold">Toutes les notes sont renseignées, mais le bulletin n'a pas été généré</p>
                  <p className="text-sm text-slate-500 mt-2">Contactez votre administrateur pour générer le bulletin</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}