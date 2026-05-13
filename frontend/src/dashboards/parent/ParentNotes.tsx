import { useEffect, useState } from 'react';
import { FileSpreadsheet, Search, User, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const getAnneeId = (value: any): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'id' in value) return value.id;
  return null;
};

export default function ParentNotes() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadChildNotes = async (childId: number, currentSelectedPeriode: string) => {
    try {
      const notesRes = await api.get(`/grades/notes/?etudiant=${childId}`);
      let childNotes = notesRes.data.results || notesRes.data;
      
      if (currentSelectedPeriode) {
        childNotes = childNotes.filter((n: any) => 
          n.evaluation_details?.periode?.toString() === currentSelectedPeriode || 
          n.evaluation_details?.periode?.id?.toString() === currentSelectedPeriode
        );
      }
      setNotes(childNotes);
    } catch (error) {
      toast.error(t('parent_notes.messages.change_child_error'));
    }
  };

  useEffect(() => {
    const fetchEnfantsNotes = async () => {
      try {
        setLoading(true);
        const [parentsRes, periodsRes, anneeRes] = await Promise.all([
          api.get('/accounts/parents/'),
          api.get('/academics/periodes/'),
          api.get('/academics/annees-scolaires/'),
        ]);
        
        const periodsData = periodsRes.data.results || periodsRes.data;
        const anneeData = anneeRes.data.results || anneeRes.data;

        const activeAnnee = anneeData.find((a: any) => a.est_active);
        const filteredPeriods = activeAnnee 
          ? periodsData.filter((p: any) => getAnneeId(p.annee_scolaire) === activeAnnee.id)
          : periodsData;
        setPeriodes(filteredPeriods);

        const activePeriode = filteredPeriods.find((p: any) => p.est_active);
        if (activePeriode && !selectedPeriode) {
          setSelectedPeriode(activePeriode.id.toString());
        }

        const parentsData = Array.isArray(parentsRes.data) ? parentsRes.data : (parentsRes.data.results || [parentsRes.data]);
        
        
        const myProfile = parentsData.find((p: any) => 
          p.utilisateur === user?.id || 
          (p.utilisateur && p.utilisateur.id === user?.id)
        );

        let childrenData = [];
        if (myProfile) {
          if (myProfile.enfants_details) {
            childrenData = myProfile.enfants_details;
          } else if (myProfile.enfants && myProfile.enfants.length > 0) {
            const promises = myProfile.enfants.map((id: number) => api.get(`/accounts/etudiants/${id}/`));
            const responses = await Promise.all(promises);
            childrenData = responses.map(r => r.data);
          }
        }

        if (childrenData.length > 0) {
          setChildren(childrenData);
          setSelectedChild(childrenData[0]);
          
          const newSelectedPeriode = activePeriode ? activePeriode.id.toString() : selectedPeriode;
          await loadChildNotes(childrenData[0].id, newSelectedPeriode);
        }
      } catch (error) {
        toast.error(t('parent_notes.messages.load_error'));
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchEnfantsNotes();
  }, [user, t]);

  const handleChildChange = async (child: any) => {
    setSelectedChild(child);
    await loadChildNotes(child.id, selectedPeriode);
  };

  const handlePeriodeChange = async (newPeriode: string) => {
    setSelectedPeriode(newPeriode);
    if (selectedChild) {
      await loadChildNotes(selectedChild.id, newPeriode);
    }
  };

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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('parent_notes.title')}</h1>
        <p className="text-slate-500 mt-1">{t('parent_notes.subtitle')}</p>
      </div>

      {}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-64">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => {
              const child = children.find(c => c.id === Number(e.target.value));
              if (child) handleChildChange(child);
            }}
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
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700"
        >
          <option value="all">{t('parent_notes.filters.all_types')}</option>
          <option value="CC">{t('evaluations_manager.types.CC')}</option>
          <option value="Examen">{t('evaluations_manager.types.Examen')}</option>
          <option value="TP">{t('evaluations_manager.types.TP')}</option>
        </select>

        <select
          value={selectedPeriode}
          onChange={(e) => handlePeriodeChange(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700"
          required
        >
          {periodes.map(p => (
            <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {selectedChild?.first_name} {selectedChild?.last_name}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('parent_notes.table.evaluation')}</th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('parent_notes.table.grade')}</th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('parent_notes.table.comment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredNotes.length > 0 ? filteredNotes.map((note, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{note.evaluation_details?.matiere_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{note.evaluation_details?.type_display || note.evaluation_details?.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    {note.est_absent ? (
                      <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-xs font-black uppercase tracking-widest">
                        {t('parent_notes.table.absent')}
                      </span>
                    ) : ( 
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black ${
                          note.valeur_note >= 10 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {note.valeur_note}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">/ {note.evaluation_details?.note_max || 20}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-6 px-8">
                    <p className="text-sm text-slate-600 font-medium italic">
                      {note.commentaire ? `"${note.commentaire}"` : t('parent_notes.table.no_comment')}
                    </p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="py-20 text-center text-slate-400 italic">
                    {t('parent_notes.no_notes')}
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