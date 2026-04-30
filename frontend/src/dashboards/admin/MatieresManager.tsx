import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

export default function MatieresManager() {
  const [matieres, setMatieres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMatiere, setCurrentMatiere] = useState<any | null>(null);

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/matieres/');
      setMatieres(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatieres();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette matière ?')) return;
    try {
      await api.delete(`/academics/matieres/${id}/`);
      toast.success('Matière supprimée');
      fetchMatieres();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (currentMatiere?.id) {
        await api.patch(`/academics/matieres/${currentMatiere.id}/`, data);
        toast.success('Matière mise à jour');
      } else {
        await api.post('/academics/matieres/', data);
        toast.success('Matière créée');
      }
      setIsModalOpen(false);
      fetchMatieres();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    }
  };

  const filteredMatieres = matieres.filter((m) =>
    (m.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matières</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez le catalogue des matières enseignées.</p>
        </div>
        <button
          onClick={() => {
            setCurrentMatiere(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher une matière..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="text-indigo-600" /></div>
      ) : (
        <Table columns={['Nom', 'Coefficient', 'Actions']} isEmpty={filteredMatieres.length === 0}>
          {filteredMatieres.map((m) => (
            <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
              <Td><div className="font-medium text-slate-900">{m.nom}</div></Td>
              <Td>{m.coefficient || '-'}</Td>
              <Td>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setCurrentMatiere(m); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentMatiere?.id ? 'Modifier la matière' : 'Ajouter une matière'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nom de la matière</label>
            <input name="nom" defaultValue={currentMatiere?.nom} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Coefficient</label>
            <input name="coefficient" type="number" step="0.1" defaultValue={currentMatiere?.coefficient} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">Sauvegarder</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
