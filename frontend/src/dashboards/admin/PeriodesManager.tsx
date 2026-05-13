import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function PeriodesManager() {
  const { t } = useTranslation();
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
      toast.error(t('periodes_manager.load_annees_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodes = async () => {
    try {
      const res = await api.get('/academics/periodes/');
      setPeriodes(res.data.results || res.data);
    } catch (error) {
      toast.error(t('periodes_manager.load_periodes_error'));
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
    };

    try {
      if (currentAnnee?.id) {
        await api.patch(`/academics/annees-scolaires/${currentAnnee.id}/`, data);
        toast.success(t('periodes_manager.annee_saved'));
      } else {
        await api.post('/academics/annees-scolaires/', data);
        toast.success(t('periodes_manager.annee_created'));
      }
      setIsAnneeModalOpen(false);
      fetchAnnees();
    } catch (error: any) {
      let errorMsg = t('periodes_manager.save_error');
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
    
    const annee_scolaire_raw = formData.get('annee_scolaire');
    const annee_scolaire = annee_scolaire_raw ? Number(annee_scolaire_raw) : null;

    if (!annee_scolaire || isNaN(annee_scolaire)) {
      toast.error(t('periodes_manager.select_annee'));
      setIsActionLoading(false);
      return;
    }

    const data = {
      annee_scolaire: annee_scolaire,
      nom: formData.get('nom'),
      date_debut: formData.get('date_debut'),
      date_fin: formData.get('date_fin'),
    };

    try {
      if (currentPeriode?.id) {
        await api.patch(`/academics/periodes/${currentPeriode.id}/`, data);
        toast.success(t('periodes_manager.periode_saved'));
      } else {
        await api.post('/academics/periodes/', data);
        toast.success(t('periodes_manager.periode_created'));
      }
      setIsPeriodeModalOpen(false);
      fetchPeriodes();
    } catch (error: any) {
      let errorMsg = t('periodes_manager.save_error');
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
      toast.success(t('periodes_manager.delete_success'));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      if (itemToDelete.type === 'annee') fetchAnnees();
      else fetchPeriodes();
    } catch (error) {
      toast.error(t('periodes_manager.delete_error'));
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('periodes_manager.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('periodes_manager.subtitle')}</p>
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
            {t('periodes_manager.new_periode')}
          </button>
          <button
            onClick={() => {
              setCurrentAnnee(null);
              setIsAnneeModalOpen(true);
            }}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('periodes_manager.new_annee')}
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
                          {annee.est_active && <span className="ml-2 text-emerald-600 font-bold">• {t('common.active')}</span>}
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
                      title={t('common.edit')}
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
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 pb-6 pt-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-600">{t('periodes_manager.periodes')}</div>
                      <button
                        onClick={() => {
                          setCurrentPeriode(null);
                          setDefaultAnneeScolaire(annee.id);
                          setIsPeriodeModalOpen(true);
                        }}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {t('periodes_manager.add_periode')}
                      </button>
                    </div>
                    {anneePeriodes.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        {t('periodes_manager.no_periodes')}
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-2">
                        <Table
                          columns={[t('periodes_manager.name'), t('periodes_manager.dates'), t('common.status'), t('common.actions')]}
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
                                  {periode.est_active ? t('common.active') : t('common.inactive')}
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
                                    title={t('common.edit')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({ id: periode.id, type: 'periode' });
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title={t('common.delete')}
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
        title={currentAnnee?.id ? t('periodes_manager.edit_annee') : t('periodes_manager.new_annee_title')}
        maxWidth="sm"
      >
        <form onSubmit={handleAnneeSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('periodes_manager.annee_name')}</label>
            <input
              name="nom"
              defaultValue={currentAnnee?.nom}
              required
              placeholder={t('periodes_manager.annee_name_placeholder')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('periodes_manager.start_date')}</label>
              <input
                name="date_debut"
                type="date"
                defaultValue={currentAnnee?.date_debut}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('periodes_manager.end_date')}</label>
              <input
                name="date_fin"
                type="date"
                defaultValue={currentAnnee?.date_fin}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAnneeModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('common.save')}
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
        title={currentPeriode?.id ? t('periodes_manager.edit_periode') : t('periodes_manager.new_periode_title')}
        maxWidth="sm"
      >
        <form onSubmit={handlePeriodeSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('periodes_manager.annee_name')}</label>
            <select
              name="annee_scolaire"
              defaultValue={getAnneeId(currentPeriode?.annee_scolaire) || defaultAnneeScolaire || ''}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
            >
              <option value="">{t('periodes_manager.select_annee')}</option>
              {anneesScolaires.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('periodes_manager.periode_name')}</label>
            <input
              name="nom"
              defaultValue={currentPeriode?.nom}
              required
              placeholder={t('periodes_manager.periode_name_placeholder')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('periodes_manager.start_date')}</label>
              <input
                name="date_debut"
                type="date"
                defaultValue={currentPeriode?.date_debut}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('periodes_manager.end_date')}</label>
              <input
                name="date_fin"
                type="date"
                defaultValue={currentPeriode?.date_fin}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              />
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPeriodeModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('common.delete')}
        message={t('periodes_manager.delete_confirm')}
        isLoading={isActionLoading}
      />
    </div>
  );
}
