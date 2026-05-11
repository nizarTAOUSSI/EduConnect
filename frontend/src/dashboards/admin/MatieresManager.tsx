import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useTranslation } from 'react-i18next';

export default function MatieresManager() {
  const { t } = useTranslation();
  const [matieres, setMatieres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentMatiere, setCurrentMatiere] = useState<any | null>(null);
  const [matiereToDelete, setMatiereToDelete] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/matieres/');
      setMatieres(res.data.results || res.data);
    } catch (error) {
      toast.error(t('matieres_manager.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, [t]);

  const handleDeleteClick = (id: number) => {
    setMatiereToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!matiereToDelete) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/academics/matieres/${matiereToDelete}/`);
      toast.success(t('matieres_manager.messages.delete_success'));
      setIsDeleteModalOpen(false);
      setMatiereToDelete(null);
      fetchMatieres();
    } catch (error) {
      toast.error(t('common.error'));
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
      coefficient: formData.get('coefficient')
    };

    try {
      if (currentMatiere?.id) {
        await api.patch(`/academics/matieres/${currentMatiere.id}/`, data);
        toast.success(t('matieres_manager.messages.update_success'));
      } else {
        await api.post('/academics/matieres/', data);
        toast.success(t('matieres_manager.messages.save_success'));
      }
      setIsModalOpen(false);
      fetchMatieres();
    } catch (error: any) {
      toast.error(t('common.error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredMatieres = matieres.filter((m) =>
    (m.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('matieres_manager.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('matieres_manager.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setCurrentMatiere(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('matieres_manager.add_subject')}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('matieres_manager.search_placeholder')}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-indigo-600" /></div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <Table columns={[t('matieres_manager.table.subject'), t('matieres_manager.table.coefficient'), t('common.actions')]} isEmpty={filteredMatieres.length === 0}>
              {filteredMatieres.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-900">{m.nom}</div>
                    </div>
                  </Td>
                  <Td><span className="font-bold text-slate-500">{m.coefficient || '-'}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button 
                        onClick={() => { setCurrentMatiere(m); setIsModalOpen(true); }} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(m.id)} 
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
        title={currentMatiere?.id ? t('matieres_manager.edit_subject') : t('matieres_manager.create_subject')}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('matieres_manager.table.subject')}</label>
            <input 
              name="nom" 
              defaultValue={currentMatiere?.nom} 
              required 
              placeholder="Ex: Mathématiques"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('matieres_manager.table.coefficient')}</label>
            <input 
              name="coefficient" 
              type="number" 
              step="0.1" 
              defaultValue={currentMatiere?.coefficient} 
              placeholder="Ex: 2.5"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200" 
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
        message={t('common.confirm')}
        isLoading={isActionLoading}
      />
    </div>
  );
}
