import { useEffect, useState } from 'react';
import { FileSpreadsheet,Search, User, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ParentNotes() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('all');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchEnfantsNotes = async () => {
      try {
        setLoading(true);
        const [parentsRes, periodsRes] = await Promise.all([
          api.get('/accounts/parents/'),
          api.get('/academics/periodes/')
        ]);
        
        const periodsData = periodsRes.data.results || periodsRes.data;
        setPeriodes(periodsData);

        const parentsData = Array.isArray(parentsRes.data) ? parentsRes.data : (parentsRes.data.results || [parentsRes.data]);
        
        // Find the specific profile for the current user
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

          const notesRes = await api.get(`/grades/notes/?etudiant=${childrenData[0].id}`);
          setNotes(notesRes.data.results || notesRes.data);
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des notes');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchEnfantsNotes();
  }, [user]);

  const handleChildChange = async (child: any) => {
    setSelectedChild(child);
    try {
      const notesRes = await api.get(`/grades/notes/?etudiant=${child.id}`);
      setNotes(notesRes.data.results || notesRes.data);
    } catch (error) {
      toast.error('Erreur lors du changement d\'enfant');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  const filteredNotes = notes.filter(n => {
    const s = searchTerm.toLowerCase();
    const matchesText = (n.evaluation_details?.matiere_name || '').toLowerCase().includes(s) || 
                        (n.commentaire || '').toLowerCase().includes(s);
    const matchesType = typeFilter === 'all' || n.evaluation_details?.type === typeFilter;
    const matchesPeriod = selectedPeriode === 'all' || n.evaluation_details?.periode?.toString() === selectedPeriode || n.evaluation_details?.periode?.id?.toString() === selectedPeriode;
    return matchesText && matchesType && matchesPeriod;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bulletin Scolaire</h1>
        <p className="text-slate-500 mt-1">Suivez les résultats académiques et les appréciations des professeurs pour vos enfants.</p>
      </div>

      {/* Child Selector & Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-64">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => {
              const child = children.find(c => c.id === Number(e.target.value));
              if (child) handleChildChange(child);
            }}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-700 appearance-none transition-all"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 gap-4">
          <select
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="all">Toutes les périodes</option>
            {periodes.map(p => (
              <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
        >
          <option value="all">Tous les types</option>
          <option value="CC">Contrôle Continu</option>
          <option value="Examen">Examen Final</option>
          <option value="TP">Travaux Pratiques</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Relevé de notes — {selectedChild?.first_name} {selectedChild?.last_name}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matière & Évaluation</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Note</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commentaire de l'Enseignant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-black text-slate-900 block leading-none mb-1">
                            {note.evaluation_details?.matiere_name || 'Matière'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {note.evaluation_details?.type_display} • {note.evaluation_details?.date} • Coeff: {note.evaluation_details?.matiere_coefficient}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-lg font-black ${note.est_absent ? 'text-rose-500' : 'text-primary'}`}>
                        {note.est_absent ? 'ABS' : `${note.valeur_note}/20`}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-md">
                        <p className="text-sm text-slate-500 italic leading-relaxed">
                          {note.commentaire ? `"${note.commentaire}"` : 'Pas de commentaire particulier.'}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                          — {note.evaluation_details?.enseignant_name}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center text-slate-400 italic">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    Aucune donnée trouvée pour cet enfant.
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