import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, School } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function SallesManager() {
  const { t } = useTranslation();
  const [salles, setSalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentSalle, setCurrentSalle] = useState<any | null>(null);
  const [salleToDelete, setSalleToDelete] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchSalles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/salles/');
      setSalles(res.data.results || res.data);
    } catch (error) {
      toast.error(t('salles_manager.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalles();
  }, []);

  const handleDeleteClick = (id: number) => {
    setSalleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!salleToDelete) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/academics/salles/${salleToDelete}/`);
      toast.success(t('salles_manager.messages.delete_success'));
      setIsDeleteModalOpen(false);
      setSalleToDelete(null);
      fetchSalles();
    } catch (error) {
      toast.error(t('salles_manager.messages.delete_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get('nom'),
      capacite: formData.get('capacite'),
      description: formData.get('description')
    };

    try {
      if (currentSalle?.id) {
        await api.patch(`/academics/salles/${currentSalle.id}/`, data);
        toast.success(t('salles_manager.messages.update_success'));
      } else {
        await api.post('/academics/salles/', data);
        toast.success(t('salles_manager.messages.save_success'));
      }
      setIsModalOpen(false);
      fetchSalles();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('salles_manager.messages.save_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredSalles = salles.filter((s) =>
    (s.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('salles_manager.title')}</h1>
          <p className="text-slate-500 mt-1">{t('salles_manager.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setCurrentSalle(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('salles_manager.add_room')}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('salles_manager.search_placeholder')}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-emerald-600" /></div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <Table columns={[t('salles_manager.table.room'), t('salles_manager.table.capacity'), 'Description', t('common.actions')]} isEmpty={filteredSalles.length === 0}>
              {filteredSalles.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <School className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-900">{s.nom}</div>
                    </div>
                  </Td>
                  <Td><span className="font-medium text-slate-600">{s.capacite || '-'}</span></Td>
                  <Td><span className="font-medium text-slate-600 truncate max-w-xs block">{s.description || '-'}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button 
                        onClick={() => { setCurrentSalle(s); setIsModalOpen(true); }} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(s.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentSalle?.id ? t('salles_manager.edit_room') : t('salles_manager.create_room')}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('common.name')}</label>
            <input 
              name="nom" 
              defaultValue={currentSalle?.nom} 
              required 
              placeholder="Ex: Salle 101"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('salles_manager.table.capacity')}</label>
            <input 
              type="number"
              name="capacite" 
              defaultValue={currentSalle?.capacite} 
              placeholder="Ex: 30"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
            <textarea 
              name="description" 
              defaultValue={currentSalle?.description} 
              placeholder="Description optionnelle..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200 min-h-[100px]" 
            />
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isActionLoading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
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
        title={t('salles_manager.delete_confirm.title')}
        message={t('salles_manager.delete_confirm.message', { name: salles.find(s => s.id === salleToDelete)?.nom })}
        confirmLabel={t('common.delete')}
        variant="danger"
        isLoading={isActionLoading}
      />
    </div>
  );
}
