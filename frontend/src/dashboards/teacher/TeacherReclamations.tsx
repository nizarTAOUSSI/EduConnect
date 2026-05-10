import { useEffect, useState } from 'react';
import { MessageSquare, Reply, CheckCircle, XCircle, Clock, Send, ShieldAlert, Search, Filter, Calendar } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

interface Reclamation {
  id: number;
  expediteur: number;
  destinataire: number;
  note?: number;
  message: string;
  statut: 'en_attente' | 'traitee' | 'rejetee';
  date_creation: string;
  reponse: string | null;
  expediteur_details?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  note_details?: {
    id: number;
    valeur_note?: number | null;
    commentaire?: string;
    est_absent?: boolean;
    evaluation_details?: {
      type: string;
      matiere_name?: string;
      classe_name?: string;
    };
  };
}

export default function TeacherReclamations() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseAction, setResponseAction] = useState<'accept' | 'reject'>('accept');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'traitee' | 'rejetee'>('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        const response = await api.get('/communication/reclamations/');
        setReclamations(response.data.results || response.data);
      } catch (error) {
        toast.error('Erreur lors du chargement des réclamations');
      } finally {
        setLoading(false);
      }
    };
    fetchReclamations();
  }, []);

  const openResponseModal = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setResponseText('');
    setResponseAction('accept');
    setIsResponseModalOpen(true);
  };

  const submitResponse = async () => {
    if (!selectedReclamation) return;
    if (!responseText.trim()) {
      toast.error('Veuillez saisir une réponse');
      return;
    }

    try {
      setIsActionLoading(true);
      const updateData = {
        reponse: responseText,
        statut: responseAction === 'accept' ? 'traitee' : 'rejetee'
      };

      await api.patch(`/communication/reclamations/${selectedReclamation.id}/`, updateData);

      setReclamations((prev:any) => prev.map((rec:any) =>
        rec.id === selectedReclamation.id
          ? { ...rec, ...updateData }
          : rec
      ));

      toast.success('Réponse envoyée avec succès');
      setIsResponseModalOpen(false);
      setSelectedReclamation(null);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setIsActionLoading(false);
    }
  };

  const pendingCount = reclamations.filter(r => r.statut === 'en_attente').length;
  const treatedCount = reclamations.filter(r => r.statut === 'traitee').length;
  const rejectedCount = reclamations.filter(r => r.statut === 'rejetee').length;

  const filteredReclamations = reclamations.filter(reclamation => {
    const searchLower = search.toLowerCase();
    const studentName = reclamation.expediteur_details 
      ? `${reclamation.expediteur_details.first_name} ${reclamation.expediteur_details.last_name}`.toLowerCase()
      : '';
    const matiere = (reclamation.note_details?.evaluation_details?.matiere_name || '').toLowerCase();
    const message = reclamation.message.toLowerCase();
    
    const matchesSearch = studentName.includes(searchLower) || 
                         matiere.includes(searchLower) || 
                         message.includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || reclamation.statut === statusFilter;
    
    const matchesDate = !dateFilter || reclamation.date_creation.includes(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Réclamations</h1>
          <p className="text-slate-500 mt-1">Gérez les réclamations des étudiants et apportez des réponses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Clock className="w-8 h-8" />} 
          count={pendingCount} 
          label="En attente" 
          color="bg-amber-50 text-amber-500" 
        />
        <StatCard 
          icon={<CheckCircle className="w-8 h-8" />} 
          count={treatedCount} 
          label="Traitées" 
          color="bg-emerald-50 text-emerald-500" 
        />
        <StatCard 
          icon={<XCircle className="w-8 h-8" />} 
          count={rejectedCount} 
          label="Rejetées" 
          color="bg-rose-50 text-rose-500" 
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par étudiant, matière ou message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-bold text-slate-700 text-sm min-w-35"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="traitee">Traitées</option>
              <option value="rejetee">Rejetées</option>
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-slate-700 text-sm"
            />
          </div>
          {(search || statusFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setDateFilter('');
              }}
              className="px-4 py-3 text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100/50 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            Boîte de Réception
          </h3>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{filteredReclamations.length} RÉSULTATS</span>
        </div>
        <div className="divide-y divide-slate-100/50">
          {filteredReclamations.length > 0 ? filteredReclamations.map((reclamation) => (
            <div key={reclamation.id} className="p-8 hover:bg-slate-50/30 transition-all duration-300 group">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200 group-hover:bg-white group-hover:scale-105 transition-all">
                      {reclamation.expediteur_details?.first_name[0] || 'E'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">
                        {reclamation.expediteur_details
                          ? `${reclamation.expediteur_details.first_name} ${reclamation.expediteur_details.last_name}`
                          : `Étudiant #${reclamation.expediteur}`}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs font-medium text-slate-400">{reclamation.date_creation}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <StatusBadge statut={reclamation.statut} />
                      </div>
                    </div>
                  </div>

                  {reclamation.note_details && (
                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 relative overflow-hidden group/note">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/note:opacity-20 transition-opacity">
                        <ShieldAlert className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-primary font-bold text-sm mb-4 uppercase tracking-wider">Détails de l'évaluation</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        <NoteInfo label="Type" value={reclamation.note_details.evaluation_details?.type} />
                        <NoteInfo label="Matière" value={reclamation.note_details.evaluation_details?.matiere_name} />
                        <NoteInfo label="Classe" value={reclamation.note_details.evaluation_details?.classe_name} />
                        <NoteInfo label="Note" value={reclamation.note_details.est_absent ? 'Absent' : reclamation.note_details.valeur_note ?? 'Non noté'} />
                      </div>
                      {reclamation.note_details.commentaire && (
                        <div className="mt-4 pt-4 border-t border-primary/10">
                          <p className="text-xs text-primary/60 font-bold mb-1 uppercase tracking-widest">Commentaire original</p>
                          <p className="text-sm text-slate-600 italic">"{reclamation.note_details.commentaire}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 group-hover:bg-white transition-colors">
                    <p className="text-slate-700 leading-relaxed">{reclamation.message}</p>
                  </div>

                  {reclamation.reponse && (
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100/50 relative">
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Votre Réponse</div>
                      <p className="text-emerald-800 leading-relaxed">{reclamation.reponse}</p>
                    </div>
                  )}
                </div>

                {reclamation.statut === 'en_attente' && (
                  <button
                    onClick={() => openResponseModal(reclamation)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 self-start w-full lg:w-auto shrink-0"
                  >
                    <Reply className="w-5 h-5" />
                    Répondre
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium italic">Aucune réclamation reçue.</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isResponseModalOpen} 
        onClose={() => setIsResponseModalOpen(false)} 
        title="Répondre à la réclamation"
        maxWidth="lg"
      >
        <div className="space-y-8">
          {selectedReclamation && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Message de l'étudiant</h4>
              <p className="text-slate-700 leading-relaxed italic">"{selectedReclamation.message}"</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 ml-1">Décision</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setResponseAction('accept')}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  responseAction === 'accept' 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-600' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-emerald-200'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">Traiter</span>
              </button>
              <button
                type="button"
                onClick={() => setResponseAction('reject')}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  responseAction === 'reject' 
                    ? 'border-rose-600 bg-rose-50 text-rose-600' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-rose-200'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span className="font-bold">Rejeter</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Votre réponse détaillée</label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 min-h-40 text-slate-700 leading-relaxed"
              placeholder="Expliquez les raisons de votre décision à l'étudiant..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResponseModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isActionLoading}
              onClick={submitResponse}
              className={`px-8 py-3 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                responseAction === 'accept' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
              }`}
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Send className="w-4 h-4" />
              {responseAction === 'accept' ? 'Valider le traitement' : 'Confirmer le rejet'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon, count, label, color }: { icon: React.ReactNode, count: number, label: string, color: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col items-center text-center group hover:shadow-xl hover:shadow-slate-100 transition-all duration-500">
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
        {icon}
      </div>
      <p className="text-4xl font-black text-slate-900">{count}</p>
      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{label}</p>
    </div>
  );
}

function StatusBadge({ statut }: { statut: string }) {
  const configs: Record<string, { color: string, icon: React.ReactNode, label: string }> = {
    en_attente: { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock className="w-3 h-3" />, label: 'En attente' },
    traitee: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle className="w-3 h-3" />, label: 'Traitée' },
    rejetee: { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: <XCircle className="w-3 h-3" />, label: 'Rejetée' }
  };
  const config = configs[statut] || configs.en_attente;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function NoteInfo({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value || 'N/A'}</p>
    </div>
  );
}