import { useEffect, useState } from 'react';
import { MessageSquare, Users, Eye, AlertCircle, Search, Filter, Calendar, User, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

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
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReclamations, setLoadingReclamations] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'traitee' | 'rejetee'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const loadChildReclamations = async (child: Child) => {
    setLoadingReclamations(true);
    try {
      // Fetch all reclamations and we will filter by expediteur (which is student user id)
      const reclamationsRes = await api.get('/communication/reclamations/');
      setReclamations(reclamationsRes.data.results || reclamationsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des réclamations');
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
            await loadChildReclamations(childrenList[0]);
          }
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des enfants');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchChildren();
  }, [user]);

  const handleChildChange = async (childId: string) => {
    const child = children.find(c => c.id === Number(childId));
    if (child) {
      setSelectedChild(child);
      // Re-fetching reclamations for the selected child (though currently we fetch all)
      await loadChildReclamations(child);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-600';
      case 'traitee': return 'bg-green-100 text-green-600';
      case 'rejetee': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'traitee': return 'Traitée';
      case 'rejetee': return 'Rejetée';
      default: return statut;
    }
  };

  const filteredReclamations = reclamations.filter(reclamation => {
    if (!selectedChild) return false;
    
    const isFromChild = reclamation.expediteur === selectedChild.utilisateur;
    if (!isFromChild) return false;

    const searchLower = search.toLowerCase();
    const message = reclamation.message.toLowerCase();
    const matchesSearch = !search || message.includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || reclamation.statut === statusFilter;
    const matchesDate = !dateFilter || reclamation.date_creation.includes(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalCount = reclamations.filter(r => selectedChild && r.expediteur === selectedChild.utilisateur).length;
  const pendingCount = reclamations.filter(r => selectedChild && r.expediteur === selectedChild.utilisateur && r.statut === 'en_attente').length;
  const resolvedCount = totalCount - pendingCount;

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Réclamations des Enfants</h1>
        <p className="text-slate-500 mt-1">Consultez et suivez les demandes de vos enfants.</p>
      </div>

      {/* Child Selector & Stats - Horizontal Layout like Absences */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Enfant sélectionné</label>
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
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{totalCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{pendingCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">En attente</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{resolvedCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Traitées</p>
          </div>
        </div>
      </div>

      {/* Selected Child Reclamations */}
      {selectedChild && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Historique détaillé pour {selectedChild.first_name} {selectedChild.last_name}
            </h3>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{filteredReclamations.length} RÉSULTATS</span>
          </div>

          {/* Filters for Selected Child */}
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans les messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-bold text-slate-700"
                >
                  <option value="all">Tous statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="traitee">Traitées</option>
                  <option value="rejetee">Rejetées</option>
                </select>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-slate-700"
                />
              </div>
            </div>
          </div>

          {loadingReclamations ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="p-6 grid gap-4">
              {filteredReclamations.length > 0 ? (
                filteredReclamations.map((reclamation) => (
                  <div key={reclamation.id} className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(reclamation.statut)}`}>
                            {getStatusText(reclamation.statut)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(reclamation.date_creation).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed">{reclamation.message}</p>
                        
                        {reclamation.reponse && (
                          <div className="mt-4 bg-emerald-50 rounded-xl p-4 border-l-4 border-emerald-400">
                            <p className="text-emerald-800 font-bold text-[10px] uppercase tracking-wider mb-1">Réponse de l'établissement</p>
                            <p className="text-emerald-700 text-sm">{reclamation.reponse}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-200" />
                  </div>
                  <h4 className="text-slate-900 font-bold mb-1">Aucune réclamation</h4>
                  <p className="text-slate-400 text-sm">Aucun message ne correspond à vos critères.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}