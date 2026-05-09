import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, School } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function SallesManager() {
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
      toast.error('Erreur lors du chargement des salles');
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
      toast.success('Salle supprimée avec succès');
      setIsDeleteModalOpen(false);
      setSalleToDelete(null);
      fetchSalles();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (currentSalle?.id) {
        await api.patch(`/academics/salles/${currentSalle.id}/`, data);
        toast.success('Salle mise à jour');
      } else {
        await api.post('/academics/salles/', data);
        toast.success('Salle créée avec succès');
      }
      setIsModalOpen(false);
      fetchSalles();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Salles</h1>
          <p className="text-slate-500 mt-1">Gérez les salles de classe et leurs capacités.</p>
        </div>
        <button
          onClick={() => {
            setCurrentSalle(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ajouter une salle
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une salle..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-emerald-600" /></div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <Table columns={['Salle', 'Capacité', 'Description', 'Actions']} isEmpty={filteredSalles.length === 0}>
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
                        title="Modifier"
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(s.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Supprimer"
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
        title={currentSalle?.id ? 'Modifier la salle' : 'Créer une salle'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Nom de la salle</label>
            <input 
              name="nom" 
              defaultValue={currentSalle?.nom} 
              required 
              placeholder="Ex: Salle 101"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Capacité</label>
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
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isActionLoading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sauvegarder
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la salle"
        message={`Êtes-vous sûr de vouloir supprimer la salle "${salles.find(s => s.id === salleToDelete)?.nom}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isActionLoading}
      />
    </div>
  );
}
