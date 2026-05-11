import { useState, useEffect } from 'react';
import { Search, Users, ChevronDown, ChevronRight, GraduationCap, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

interface User { id: number; first_name: string; last_name: string; email: string; is_active: boolean; }
interface ParentChild { id: number; }
interface RawParent { id: number; utilisateur: number; enfants: (number | ParentChild)[]; is_active?: boolean; nom_complet?: string; first_name?: string; last_name?: string; email?: string; }
interface RawStudent { id: number; utilisateur: number; code_apogee?: string; classe?: number | null; classe_name?: string | null; first_name?: string; last_name?: string; email?: string; }
interface Parent {
  id: number; utilisateur: number; is_active: boolean; enfants: number[];
  first_name: string; last_name: string; email: string; nom_complet: string;
}
interface Student {
  id: number; utilisateur: number; code_apogee: string; classe: number | null;
  first_name: string; last_name: string; email: string; classe_name: string | null;
}
interface Classe { id: number; nom: string; niveau: string; }

const buildName = (first: string, last: string, email: string, fallback: string) => {
  const full = `${first} ${last}`.trim();
  return full || email || fallback;
};

const getInitials = (first: string, last: string, email: string) =>
  ((first?.[0] || email?.[0] || '?') + (last?.[0] || '')).toUpperCase();

export default function ParentsManager() {
  const { t } = useTranslation();
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<Record<number, number | ''>>({});
  const [savingParentId, setSavingParentId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadAll = async () => {
    try {
      const [pRes, sRes, cRes, uRes] = await Promise.all([
        api.get('/accounts/parents/'),
        api.get('/accounts/etudiants/'),
        api.get('/academics/classes/'),
        api.get('/accounts/utilisateurs/'),
      ]);

      const rawUsers: User[] = uRes.data.results || uRes.data;
      const userMap = new Map(rawUsers.map(u => [u.id, u]));

      const rawParents: RawParent[] = pRes.data.results || pRes.data;
      const enrichedParents: Parent[] = rawParents.map(p => {
        const user = userMap.get(p.utilisateur) || { first_name: '', last_name: '', email: '', is_active: true } as User;
        const first = p.first_name || user.first_name || '';
        const last  = p.last_name  || user.last_name  || '';
        const email = p.email      || user.email      || '';
        return {
          id: p.id,
          utilisateur: p.utilisateur,
          is_active: p.is_active ?? user.is_active ?? true,

          enfants: Array.isArray(p.enfants)
            ? p.enfants.map((e: ParentChild | number) => typeof e === 'object' ? e.id : e)
            : [],
          first_name: first,
          last_name: last,
          email: email,
          nom_complet: p.nom_complet?.trim() || buildName(first, last, email, ''),
        };
      });

      const rawStudents: RawStudent[] = sRes.data.results || sRes.data;
      const enrichedStudents: Student[] = rawStudents.map(s => {
        const user = userMap.get(s.utilisateur) || { first_name: '', last_name: '', email: '', is_active: true } as User;
        return {
          id: s.id,
          utilisateur: s.utilisateur,
          code_apogee: s.code_apogee || '',
          classe: s.classe ?? null,
          classe_name: s.classe_name || null,
          first_name: s.first_name || user.first_name || '',
          last_name:  s.last_name  || user.last_name  || '',
          email:      s.email      || user.email      || '',
        };
      });

      setParents(enrichedParents);
      setStudents(enrichedStudents);
      setClasses(cRes.data.results || cRes.data);
    } catch (e) {
      console.error(e);
      toast.error(t('parents_manager.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resolveClass = (s: Student) => {
    if (s.classe_name?.trim()) return s.classe_name.trim();
    if (s.classe !== null) {
      const cls = classes.find(c => c.id === s.classe);
      return cls ? `${cls.nom} — ${cls.niveau}` : `Classe #${s.classe}`;
    }
    return null;
  };

  const getChildren = (parent: Parent) => students.filter(s => parent.enfants.includes(s.id));

  const handleAttachChild = async (parent: Parent) => {
    if (!selectedChildIds[parent.id]) return;
    const childId = selectedChildIds[parent.id] as number;
    const updatedChildren = Array.from(new Set([...parent.enfants, childId]));
    try {
      setSavingParentId(parent.id);
      await api.patch(`/accounts/parents/${parent.id}/`, { enfants: updatedChildren });
      await loadAll();
      setSelectedChildIds(prev => ({ ...prev, [parent.id]: '' }));
      toast.success(t('parents_manager.messages.attach_success'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('parents_manager.messages.attach_error'));
    } finally {
      setSavingParentId(null);
    }
  };

  const handleDetachChild = async (parent: Parent, childId: number) => {
    const updatedChildren = parent.enfants.filter(id => id !== childId);
    try {
      setSavingParentId(parent.id);
      await api.patch(`/accounts/parents/${parent.id}/`, { enfants: updatedChildren });
      await loadAll();
      toast.success(t('parents_manager.messages.detach_success'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('parents_manager.messages.detach_error'));
    } finally {
      setSavingParentId(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingParent) return;

    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
    };

    try {
      await api.patch(`/accounts/utilisateurs/${editingParent.utilisateur}/`, data);
      toast.success(t('parents_manager.messages.update_success'));
      setIsEditModalOpen(false);
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('parents_manager.messages.update_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const getAvailableChildren = (parent: Parent) =>
    students.filter(s => !parent.enfants.includes(s.id));

  const filtered = parents.filter(p => {
    const name = buildName(p.first_name, p.last_name, p.email, '').toLowerCase();
    return (name + p.email).toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('parents_manager.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('parents_manager.subtitle', { count: parents.length })}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder={t('parents_manager.search_placeholder')} 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400">{t('parents_manager.no_parents')}</div>}

        {filtered.map(parent => {
          const isExpanded = expandedId === parent.id;
          const name = buildName(parent.first_name, parent.last_name, parent.email, `Parent #${parent.id}`);
          const ini = getInitials(parent.first_name, parent.last_name, parent.email);
          const children = getChildren(parent);

          return (
            <div key={parent.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-base shrink-0">
                  {ini}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-base truncate">{name}</p>
                  <p className="text-xs text-slate-500">{parent.email || '—'}</p>
                  <p className="text-xs text-slate-400">{t('parents_manager.subtitle', { count: children.length })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${parent.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <button 
                    onClick={() => {
                      setEditingParent(parent);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedId(isExpanded ? null : parent.id)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Users className="w-4 h-4 text-rose-500" /> {t('parents_manager.attached_children')}
                  </h4>

                  <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <select
                      value={selectedChildIds[parent.id] ?? ''}
                      onChange={e => setSelectedChildIds(prev => ({ ...prev, [parent.id]: Number(e.target.value) || '' }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      <option value="">{t('parents_manager.add_child')}</option>
                      {getAvailableChildren(parent).map(child => (
                        <option key={child.id} value={child.id}>
                          {buildName(child.first_name, child.last_name, child.email, `Étudiant #${child.id}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAttachChild(parent)}
                      disabled={!selectedChildIds[parent.id] || savingParentId === parent.id}
                      className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                    >
                      {t('parents_manager.attach')}
                    </button>
                  </div>

                  {children.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      {parent.enfants.length > 0
                        ? t('parents_manager.children_not_found', { count: parent.enfants.length })
                        : t('parents_manager.no_children')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {children.map(child => {
                        const childName = buildName(child.first_name, child.last_name, child.email, `Étudiant #${child.id}`);
                        const childIni  = getInitials(child.first_name, child.last_name, child.email);
                        const childClass = resolveClass(child);
                        return (
                          <div key={child.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                              {childIni}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-sm truncate">{childName}</p>
                              <p className="text-xs text-slate-400 truncate">{child.email}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${childClass ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                  <GraduationCap className="w-2.5 h-2.5" />
                                  {childClass ?? 'Sans classe'}
                                </span>
                                <span className="text-[10px] text-slate-400">Code : {child.code_apogee}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDetachChild(parent, child.id)}
                              disabled={savingParentId === parent.id}
                              className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition"
                            >
                              {t('parents_manager.detach')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('parents_manager.edit_parent')}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.first_name')}</label>
              <input
                name="first_name"
                defaultValue={editingParent?.first_name}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.last_name')}</label>
              <input
                name="last_name"
                defaultValue={editingParent?.last_name}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('common.email')}</label>
            <input
              name="email"
              type="email"
              defaultValue={editingParent?.email}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
          
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
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
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}