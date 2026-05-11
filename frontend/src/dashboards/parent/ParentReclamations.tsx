import { useEffect, useState } from 'react';
import { MessageSquare, Search, Filter, Calendar, User, Clock, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface Child {
  id: number;
  utilisateur: number;
  code_apogee: string;
  classe: number | null;
  first_name: string;
  last_name: string;
  email: string;
  classe_name: string | null;
}

interface Reclamation {
  id: number;
  expediteur: number;
  destinataire: number;
  message: string;
  statut: 'en_attente' | 'traitee' | 'rejetee';
  date_creation: string;
  reponse: string | null;
  expediteur_details?: {
    utilisateur: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export default function ParentReclamations() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReclamations, setLoadingReclamations] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'traitee' | 'rejetee'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const loadChildReclamations = async () => {
    setLoadingReclamations(true);
    try {
      const reclamationsRes = await api.get('/communication/reclamations/');
      setReclamations(reclamationsRes.data.results || reclamationsRes.data);
    } catch (error) {
      toast.error(t('parent_reclamations.messages.load_reclamations_error'));
    } finally {
      setLoadingReclamations(false);
    }
  };

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const parentsRes = await api.get('/accounts/parents/');
        const parentsData = Array.isArray(parentsRes.data) ? parentsRes.data : (parentsRes.data.results || [parentsRes.data]);
        
        const myProfile = parentsData.find((p: { utilisateur: number | { id: number } }) => {
          const pUserId = typeof p.utilisateur === 'object' ? p.utilisateur.id : p.utilisateur;
          return pUserId === user?.id;
        });

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
            // await loadChildReclamations(childrenList[0]);
            await loadChildReclamations();

          }
        }
      } catch (error) {
        toast.error(t('parent_reclamations.messages.load_children_error'));
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchChildren();
  }, [user, t]);

  const handleChildChange = async (childId: string) => {
    const child = children.find(c => c.id === parseInt(childId));
    if (child) {
      setSelectedChild(child);
      // Logic to filter reclamations for specific child if API supports it
      // For now we just reload all
      await loadChildReclamations();
    }
  };

  const filteredReclamations = reclamations.filter(rec => {
    const matchesSearch = rec.message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rec.statut === statusFilter;
    const matchesDate = !dateFilter || rec.date_creation.startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('parent_reclamations.title')}</h1>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-64">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => handleChildChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 transition-all"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('parent_reclamations.filters.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        <div className="relative w-full md:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 transition-all"
          >
            <option value="all">{t('parent_reclamations.filters.all_status')}</option>
            <option value="en_attente">{t('student_reclamations.status.en_attente')}</option>
            <option value="traitee">{t('student_reclamations.status.traitee')}</option>
            <option value="rejetee">{t('student_reclamations.status.rejetee')}</option>
          </select>
        </div>

        <div className="relative w-full md:w-48">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingReclamations ? (
          <div className="py-20 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-slate-50/50 border-b border-slate-100">
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('parent_reclamations.table.message')}</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('parent_reclamations.table.status')}</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('parent_reclamations.table.date')}</th>
                  <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('parent_reclamations.table.response')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReclamations.length > 0 ? filteredReclamations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium line-clamp-2 mt-1">{rec.message}</p>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        rec.statut === 'traitee' ? 'bg-emerald-100 text-emerald-600' :
                        rec.statut === 'rejetee' ? 'bg-rose-100 text-rose-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {t(`student_reclamations.status.${rec.statut}`)}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-600">{new Date(rec.date_creation).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      {rec.reponse ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-bold">{rec.reponse}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">{t('parent_reclamations.table.no_response')}</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-400 italic">
                      {t('parent_reclamations.no_reclamations')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}