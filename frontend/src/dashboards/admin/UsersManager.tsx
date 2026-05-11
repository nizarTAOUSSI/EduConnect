import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, UserCheck, Shield, GraduationCap, Users } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import type { User } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function UsersManager() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/utilisateurs/');
      setUsers(res.data.results || res.data);
    } catch (error) {
      toast.error(t('users_manager.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [t]);

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/accounts/utilisateurs/${userToDelete}/`);
      toast.success(t('users_manager.messages.delete_success'));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error(t('users_manager.messages.delete_error'));
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
      if (currentUser?.id) {
        await api.patch(`/accounts/utilisateurs/${currentUser.id}/`, data);
        toast.success(t('users_manager.messages.update_success'));
      } else {
        await api.post('/accounts/utilisateurs/', { ...data, username: data.email });
        toast.success(t('users_manager.messages.save_success'));
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('users_manager.messages.save_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.first_name + ' ' + u.last_name + ' ' + u.email)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return { bg: 'bg-purple-50', text: 'text-purple-700', icon: Shield };
      case 'enseignant': return { bg: 'bg-blue-50', text: 'text-blue-700', icon: UserCheck };
      case 'etudiant': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: GraduationCap };
      case 'parent': return { bg: 'bg-amber-50', text: 'text-amber-700', icon: Users };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', icon: Users };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('users_manager.title')}</h1>
          <p className="text-slate-500 mt-1">{t('users_manager.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setCurrentUser(null);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('users_manager.add_user')}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('users_manager.search_placeholder')}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 font-medium text-slate-700"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{t('common.all_roles')}</option>
            <option value="admin">{t('roles.admin')}</option>
            <option value="enseignant">{t('roles.enseignant')}</option>
            <option value="etudiant">{t('roles.etudiant')}</option>
            <option value="parent">{t('roles.parent')}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <Table
              columns={[t('users_manager.table.user'), t('users_manager.table.email'), t('users_manager.table.role'), t('common.status'), t('common.actions')]}
              isEmpty={filteredUsers.length === 0}
            >
              {filteredUsers.map((u) => {
                const roleBadge = getRoleBadge(u.role);
                const RoleIcon = roleBadge.icon;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${roleBadge.bg} ${roleBadge.text}`}>
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div>
                      </div>
                    </Td>
                    <Td><span className="text-slate-600">{u.email}</span></Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold capitalize ${roleBadge.bg} ${roleBadge.text}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {t(`roles.${u.role}`)}
                      </span>
                    </Td>
                    <Td>
                      {u.is_active ? (
                        <span className="text-emerald-600 flex items-center gap-2 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          {t('common.active')}
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-2 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                          {t('common.inactive')}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => {
                            setCurrentUser(u);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentUser?.id ? t('users_manager.edit_user') : t('users_manager.add_user')}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.first_name')}</label>
              <input
                name="first_name"
                defaultValue={currentUser?.first_name}
                required
                placeholder="Ex: Jean"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.last_name')}</label>
              <input
                name="last_name"
                defaultValue={currentUser?.last_name}
                required
                placeholder="Ex: Dupont"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.login.email')}</label>
            <input
              name="email"
              type="email"
              defaultValue={currentUser?.email}
              required
              placeholder="jean.dupont@exemple.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
          {!currentUser?.id && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.password')}</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.role')}</label>
            <select
              name="role"
              defaultValue={currentUser?.role || 'etudiant'}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 font-medium text-slate-700"
            >
              <option value="admin">{t('roles.admin')}</option>
              <option value="enseignant">{t('roles.enseignant')}</option>
              <option value="etudiant">{t('roles.etudiant')}</option>
              <option value="parent">{t('roles.parent')}</option>
            </select>
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
              className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {currentUser?.id ? t('common.save') : t('users_manager.add_user')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('users_manager.delete_confirm.title')}
        message={t('users_manager.delete_confirm.message', { name: users.find(u => u.id === userToDelete)?.first_name })}
        confirmLabel={t('common.delete')}
        variant="danger"
        isLoading={isActionLoading}
      />
    </div>
  );
}
