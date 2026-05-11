import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle2, Calendar, Search, User, XCircle, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function ParentAbsences() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAbsences, setLoadingAbsences] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const parentsRes = await api.get('/accounts/parents/');
        const parentsData = Array.isArray(parentsRes.data) ? parentsRes.data : (parentsRes.data.results || [parentsRes.data]);
        const myProfile = parentsData.find((p: any) => 
          p.utilisateur === user?.id || 
          (p.utilisateur && p.utilisateur.id === user?.id)
        );

        if (myProfile) {
          let childrenList = [];
          if (myProfile.enfants_details) {
            childrenList = myProfile.enfants_details;
          } else if (myProfile.enfants) {
            const promises = myProfile.enfants.map((id: number) => api.get(`/accounts/etudiants/${id}/`));
            const responses = await Promise.all(promises);
            childrenList = responses.map(r => r.data);
          }
          setChildren(childrenList);
          if (childrenList.length > 0) {
            setSelectedChild(childrenList[0]);
            await fetchAbsences(childrenList[0].id);
          }
        }
      } catch (error) {
        toast.error(t('parent_absences.messages.load_children_error'));
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchChildren();
  }, [user, t]);

  const fetchAbsences = async (childId: number) => {
    try {
      setLoadingAbsences(true);
      const res = await api.get(`/academics/absences/?etudiant=${childId}`);
      setAbsences(res.data.results || res.data);
    } catch (error) {
      toast.error(t('parent_absences.messages.load_absences_error'));
    } finally {
      setLoadingAbsences(false);
    }
  };

  const handleChildChange = async (childId: string) => {
    const child = children.find(c => c.id === Number(childId));
    if (child) {
      setSelectedChild(child);
      await fetchAbsences(child.id);
    }
  };

  const filteredAbsences = absences.filter(abs => {
    const searchLower = searchTerm.toLowerCase();
    const matchesText = (abs.enseignant_matiere_details?.matiere_name || '').toLowerCase().includes(searchLower) ||
                        (abs.enseignant_matiere_details?.enseignant_name || '').toLowerCase().includes(searchLower);
    const matchesDate = !dateFilter || abs.date === dateFilter;
    return matchesText && matchesDate;
  });

  const justifiedCount = absences.filter(a => a.justifiee).length;
  const unjustifiedCount = absences.length - justifiedCount;

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('parent_absences.title')}</h1>
      </div>

      {/* Child Selector & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">{t('parent_absences.selected_child')}</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={selectedChild?.id || ''}
              onChange={(e) => handleChildChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 transition-all"
            >
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{unjustifiedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('parent_absences.stats.unjustified')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{justifiedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('parent_absences.stats.justified')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('parent_absences.filters.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="relative w-full md:w-64">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700"
          />
        </div>
      </div>

      {/* Absences List (Student Style) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            {t('parent_absences.history_title', { name: `${selectedChild?.first_name} ${selectedChild?.last_name}` })}
          </h3>
        </div>

        {loadingAbsences ? (
          <div className="py-20 flex justify-center"><Spinner /></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAbsences.length > 0 ? filteredAbsences.map((abs, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-8 hover:bg-slate-50/50 transition-colors gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{t('parent_absences.table.date')}</span>
                    <span className="text-sm font-black text-slate-900">{abs.date.split('-').reverse().join('/')}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-slate-900">
                        {abs.enseignant_matiere_details?.matiere_name || t('timetable_grid.unspecified')}
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
                          <span>Durée: {abs.duree_heures}h</span>
                        )}
                      </p>
                      {abs.enseignant_matiere_details?.enseignant_name && (
                        <p className="text-sm text-slate-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          {abs.enseignant_matiere_details.enseignant_name}
                        </p>
                      )}
                    </div>
                    {abs.motif && (
                      <p className="text-xs text-slate-400 italic mt-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block">
                        Motif: {abs.motif}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest self-start md:self-center ${
                  abs.justifiee ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {abs.justifiee ? t('parent_absences.table.justified') : t('parent_absences.table.unjustified')}
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                {t('parent_absences.no_absences')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
