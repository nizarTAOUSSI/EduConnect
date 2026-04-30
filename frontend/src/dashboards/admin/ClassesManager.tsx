import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

export default function ClassesManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<any | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/classes/');
      setClasses(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette classe ?')) return;
    try {
      await api.delete(`/academics/classes/${id}/`);
      toast.success('Classe supprimée');
      fetchClasses();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (currentClass?.id) {
        await api.patch(`/academics/classes/${currentClass.id}/`, data);
        toast.success('Classe mise à jour');
      } else {
        await api.post('/academics/classes/', data);
        toast.success('Classe créée');
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    }
  };

  const filteredClasses = classes.filter((c) =>
    (c.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les classes et leurs niveaux.</p>
        </div>
        <button
          onClick={() => {
            setCurrentClass(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher une classe..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="text-emerald-600" /></div>
      ) : (
        <Table columns={['Nom', 'Niveau', 'Actions']} isEmpty={filteredClasses.length === 0}>
          {filteredClasses.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
              <Td><div className="font-medium text-slate-900">{c.nom}</div></Td>
              <Td>{c.niveau}</Td>
              <Td>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setCurrentClass(c); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentClass?.id ? 'Modifier la classe' : 'Ajouter une classe'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nom de la classe</label>
            <input name="nom" defaultValue={currentClass?.nom} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Niveau</label>
            <input name="niveau" defaultValue={currentClass?.niveau} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">Sauvegarder</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
