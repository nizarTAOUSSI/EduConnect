import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function PeriodesManager() {
  const [anneesScolaires, setAnneesScolaires] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAnnees, setExpandedAnnees] = useState<number[]>([]);
  
  const [isAnneeModalOpen, setIsAnneeModalOpen] = useState(false);
  const [isPeriodeModalOpen, setIsPeriodeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentAnnee, setCurrentAnnee] = useState<any | null>(null);
  const [currentPeriode, setCurrentPeriode] = useState<any | null>(null);
  const [defaultAnneeScolaire, setDefaultAnneeScolaire] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'annee' | 'periode' } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchAnnees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/annees-scolaires/');
      setAnneesScolaires(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des années scolaires');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodes = async () => {
    try {
      const res = await api.get('/academics/periodes/');
      setPeriodes(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des périodes');
    }
  };

  useEffect(() => {
    fetchAnnees();
    fetchPeriodes();
  }, []);

  const toggleAnnee = (id: number) => {
    setExpandedAnnees(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAnneeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get('nom'),
      date_debut: formData.get('date_debut'),
      date_fin: formData.get('date_fin'),
      est_active: formData.get('est_active') === 'on',
    };

    try {
      if (currentAnnee?.id) {
        await api.patch(`/academics/annees-scolaires/${currentAnnee.id}/`, data);
        toast.success('Année scolaire mise à jour avec succès');
      } else {
        await api.post('/academics/annees-scolaires/', data);
        toast.success('Année scolaire créée avec succès');
      }
      setIsAnneeModalOpen(false);
      fetchAnnees();
    } catch (error: any) {
      let errorMsg = 'Erreur lors de l\'enregistrement';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = [];
          for (const key in error.response.data) {
            const value = error.response.data[key];
            if (Array.isArray(value)) {
              errors.push(...value);
            } else if (typeof value === 'string') {
              errors.push(value);
            }
          }
          errorMsg = errors.join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        }
      }
      console.error('Erreur complète:', error);
      toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePeriodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      annee_scolaire: Number(formData.get('annee_scolaire')),
      nom: formData.get('nom'),
      date_debut: formData.get('date_debut'),
      date_fin: formData.get('date_fin'),
      est_active: formData.get('est_active') === 'on',
    };

    try {
      if (currentPeriode?.id) {
        await api.patch(`/academics/periodes/${currentPeriode.id}/`, data);
        toast.success('Période mise à jour avec succès');
      } else {
        await api.post('/academics/periodes/', data);
        toast.success('Période créée avec succès');
      }
      setIsPeriodeModalOpen(false);
      fetchPeriodes();
    } catch (error: any) {
      let errorMsg = 'Erreur lors de l\'enregistrement';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = [];
          for (const key in error.response.data) {
            const value = error.response.data[key];
            if (Array.isArray(value)) {
              errors.push(...value);
            } else if (typeof value === 'string') {
              errors.push(value);
            }
          }
          errorMsg = errors.join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        }
      }
      console.error('Erreur complète:', error);
      toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsActionLoading(true);
      const endpoint = itemToDelete.type === 'annee' 
        ? `/academics/annees-scolaires/${itemToDelete.id}/` 
        : `/academics/periodes/${itemToDelete.id}/`;
      await api.delete(endpoint);
      toast.success('Suppression réussie');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      if (itemToDelete.type === 'annee') fetchAnnees();
      else fetchPeriodes();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getAnneeId = (value: any): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null && 'id' in value) return value.id;
    return null;
  };

  const getPeriodesForAnnee = (anneeId: number) => {
    return periodes.filter(p => getAnneeId(p.annee_scolaire) === anneeId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Années & Périodes</h1>
          <p className="text-slate-500 mt-1 font-medium">Gérez les années scolaires et leurs périodes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentPeriode(null);
              setIsPeriodeModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle période
          </button>
          <button
            onClick={() => {
              setCurrentAnnee(null);
              setIsAnneeModalOpen(true);
            }}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle année
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-indigo-600" /></div>
        ) : (
          anneesScolaires.map((annee) => {
            const anneePeriodes = getPeriodesForAnnee(annee.id);
            const isExpanded = expandedAnnees.includes(annee.id);
            return (
              <div key={annee.id} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div
                  className="p-6 cursor-pointer flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  onClick={() => toggleAnnee(annee.id)}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAnnee(annee.id); }}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${annee.est_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{annee.nom}</div>
                        <div className="text-sm text-slate-500">
                          {new Date(annee.date_debut).toLocaleDateString('fr-FR')} - {new Date(annee.date_fin).toLocaleDateString('fr-FR')}
                          {annee.est_active && <span className="ml-2 text-emerald-600 font-bold">• Active</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAnnee(annee);
                        setIsAnneeModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ id: annee.id, type: 'annee' });
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-600">Périodes</div>
                      <button
                        onClick={() => {
                          setCurrentPeriode(null);
                          setDefaultAnneeScolaire(annee.id);
                          setIsPeriodeModalOpen(true);
                        }}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter une période
                      </button>
                    </div>
                    {anneePeriodes.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        Aucune période pour cette année scolaire
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-2">
                        <Table
                          columns={['Nom', 'Dates', 'Statut', 'Actions']}
                          isEmpty={false}
                        >
                          {anneePeriodes.map((periode) => (
                            <tr key={periode.id} className="hover:bg-slate-50/50 transition-colors">
                              <Td>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-slate-900">{periode.nom}</span>
                                </div>
                              </Td>
                              <Td>
                                <span className="text-slate-500 text-sm">
                                  {new Date(periode.date_debut).toLocaleDateString('fr-FR')} - {new Date(periode.date_fin).toLocaleDateString('fr-FR')}
                                </span>
                              </Td>
                              <Td>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${periode.est_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {periode.est_active ? 'Active' : 'Inactive'}
                                </span>
                              </Td>
                              <Td>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setCurrentPeriode(periode);
                                      setIsPeriodeModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({ id: periode.id, type: 'periode' });
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </Td>
                            </tr>
                          ))}
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isAnneeModalOpen}
        onClose={() => setIsAnneeModalOpen(false)}
        title={currentAnnee?.id ? 'Modifier l\'année scolaire' : 'Nouvelle année scolaire'}
        maxWidth="sm"
      >
        <form onSubmit={handleAnneeSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Nom de l'année scolaire</label>
            <input
              name="nom"
              defaultValue={currentAnnee?.nom}
              required
              placeholder="Ex: 2024-2025"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Date de début</label>
              <input
                name="date_debut"
                type="date"
                defaultValue={currentAnnee?.date_debut}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Date de fin</label>
              <input
                name="date_fin"
                type="date"
                defaultValue={currentAnnee?.date_fin}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="est_active_annee"
              name="est_active"
              type="checkbox"
              defaultChecked={currentAnnee?.est_active}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="est_active_annee" className="text-sm font-bold text-slate-700">Année active</label>
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAnneeModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPeriodeModalOpen}
        onClose={() => {
          setIsPeriodeModalOpen(false);
          setDefaultAnneeScolaire(null);
        }}
        title={currentPeriode?.id ? 'Modifier la période' : 'Nouvelle période'}
        maxWidth="sm"
      >
        <form onSubmit={handlePeriodeSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Année scolaire</label>
            <select
              name="annee_scolaire"
              defaultValue={getAnneeId(currentPeriode?.annee_scolaire) || defaultAnneeScolaire || ''}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
            >
              <option value="">Sélectionnez une année</option>
              {anneesScolaires.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Nom de la période</label>
            <input
              name="nom"
              defaultValue={currentPeriode?.nom}
              required
              placeholder="Ex: Semestre 1"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Date de début</label>
              <input
                name="date_debut"
                type="date"
                defaultValue={currentPeriode?.date_debut}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Date de fin</label>
              <input
                name="date_fin"
                type="date"
                defaultValue={currentPeriode?.date_fin}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="est_active_periode"
              name="est_active"
              type="checkbox"
              defaultChecked={currentPeriode?.est_active}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="est_active_periode" className="text-sm font-bold text-slate-700">Période active</label>
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPeriodeModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer"
        message="Êtes-vous sûr de vouloir supprimer cet élément ?"
        isLoading={isActionLoading}
      />
    </div>
  );
}
