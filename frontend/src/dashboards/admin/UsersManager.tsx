import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import type { User } from '../../context/AuthContext';

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/utilisateurs/');
      setUsers(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/accounts/utilisateurs/${id}/`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (currentUser?.id) {
        await api.patch(`/accounts/utilisateurs/${currentUser.id}/`, data);
        toast.success('Utilisateur mis à jour');
      } else {
        await api.post('/accounts/utilisateurs/', { ...data, username: data.email });
        toast.success('Utilisateur créé');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.first_name + ' ' + u.last_name + ' ' + u.email)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les comptes enseignants, étudiants et parents.</p>
        </div>
        <button
          onClick={() => {
            setCurrentUser(null);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="enseignant">Enseignant</option>
          <option value="etudiant">Étudiant</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <Table
          columns={['Nom', 'Email', 'Rôle', 'Statut', 'Actions']}
          isEmpty={filteredUsers.length === 0}
        >
          {filteredUsers.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
              <Td>
                <div className="font-medium text-slate-900">{u.first_name} {u.last_name}</div>
              </Td>
              <Td>{u.email}</Td>
              <Td>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'enseignant' ? 'bg-blue-100 text-blue-800' :
                    u.role === 'etudiant' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'}`}
                >
                  {u.role}
                </span>
              </Td>
              <Td>
                {u.is_active ? (
                  <span className="text-emerald-600 flex items-center gap-1.5 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Actif
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactif
                  </span>
                )}
              </Td>
              <Td>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setCurrentUser(u);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentUser?.id ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Prénom</label>
              <input
                name="first_name"
                defaultValue={currentUser?.first_name}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Nom</label>
              <input
                name="last_name"
                defaultValue={currentUser?.last_name}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={currentUser?.email}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {!currentUser?.id && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Mot de passe</label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Rôle</label>
            <select
              name="role"
              defaultValue={currentUser?.role || 'etudiant'}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="admin">Admin</option>
              <option value="enseignant">Enseignant</option>
              <option value="etudiant">Étudiant</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
