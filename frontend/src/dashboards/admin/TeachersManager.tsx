import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, BookOpen, GraduationCap, Edit2, X, Plus } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { useTranslation } from 'react-i18next';

interface User { id: number; first_name: string; last_name: string; email: string; is_active: boolean; }
interface Teacher {
  id: number; utilisateur: number; specialite: string; is_active: boolean;

  first_name: string; last_name: string; email: string; nom_complet: string;
}
interface Matiere { id: number; nom: string; coefficient: number; }
interface Classe { id: number; nom: string; niveau: string; }
interface Assignment { id: number; enseignant: number; matiere: number; classe: number; matiere_name?: string; classe_name?: string; }

const buildName = (first: string, last: string, email: string, fallback: string) => {
  const full = `${first} ${last}`.trim();
  return full || email || fallback;
};

export default function TeachersManager() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<Record<number, { assignments: Assignment[]; loading: boolean }>>({});
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', specialite: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [addingAsgn, setAddingAsgn] = useState<number | null>(null);
  const [newAsgn, setNewAsgn] = useState<Record<number, { matiere: string[]; classe: string[] }>>({});

  const resolveName = (a: Assignment) => ({
    mName: a.matiere_name || matieres.find(m => m.id === a.matiere)?.nom || `Matière #${a.matiere}`,
    cName: a.classe_name || classes.find(c => c.id === a.classe)?.nom || `Classe #${a.classe}`,
  });

  const loadAll = async () => {
    const [tRes, mRes, cRes, uRes] = await Promise.all([
      api.get('/accounts/enseignants/'),
      api.get('/academics/matieres/'),
      api.get('/academics/classes/'),
      api.get('/accounts/utilisateurs/'),
    ]);
    const rawTeachers = tRes.data.results || tRes.data;
    const rawUsers: User[] = uRes.data.results || uRes.data;
    const userMap = new Map(rawUsers.map(u => [u.id, u]));

    const enriched: Teacher[] = rawTeachers.map((t: any) => {
      const user = userMap.get(t.utilisateur) || { first_name: '', last_name: '', email: '', is_active: true } as User;
      const first = t.first_name || user.first_name || '';
      const last = t.last_name || user.last_name || '';
      const email = t.email || user.email || '';
      return {
        id: t.id,
        utilisateur: t.utilisateur,
        specialite: t.specialite || '',
        is_active: t.is_active ?? user.is_active ?? true,
        first_name: first,
        last_name: last,
        email: email,
        nom_complet: t.nom_complet?.trim() || buildName(first, last, email, ''),
      };
    });

    setTeachers(enriched);
    setMatieres(mRes.data.results || mRes.data);
    setClasses(cRes.data.results || cRes.data);
  };

  useEffect(() => {
    loadAll().catch(() => toast.error(t('common.error'))).finally(() => setLoading(false));
  }, [t]);

  const loadDetail = async (teacher: Teacher) => {
    if (detailData[teacher.id]) return;
    setDetailData(prev => ({ ...prev, [teacher.id]: { assignments: [], loading: true } }));
    try {
      const res = await api.get(`/academics/enseignant-matieres/?enseignant=${teacher.id}`);
      setDetailData(prev => ({ ...prev, [teacher.id]: { assignments: res.data.results || res.data, loading: false } }));
    } catch {
      setDetailData(prev => ({ ...prev, [teacher.id]: { assignments: [], loading: false } }));
    }
  };

  const toggle = (teacher: Teacher) => {
    if (expandedId === teacher.id) { setExpandedId(null); return; }
    setExpandedId(teacher.id);
    loadDetail(teacher);
  };

  const startEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setEditForm({
      first_name: t.first_name,
      last_name: t.last_name,
      email: t.email,
      specialite: t.specialite,
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    
    setIsActionLoading(true);
    try {
      await api.patch(`/accounts/utilisateurs/${editingTeacher.utilisateur}/`, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
      });
      await api.patch(`/accounts/enseignants/${editingTeacher.id}/`, { specialite: editForm.specialite });
      toast.success(t('teachers_manager.messages.update_success'));
      setIsEditModalOpen(false);
      setEditingTeacher(null);
      await loadAll();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || t('common.error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteAssignment = async (teacherId: number, asgnId: number) => {
    try {
      await api.delete(`/academics/enseignant-matieres/${asgnId}/`);
      toast.success(t('teachers_manager.messages.delete_assignment_success'));
      setDetailData(prev => ({ ...prev, [teacherId]: { ...prev[teacherId], assignments: prev[teacherId].assignments.filter(a => a.id !== asgnId) } }));
    } catch { toast.error(t('common.error')); }
  };

  const addAssignments = async (teacher: Teacher) => {
    const form = newAsgn[teacher.id] || { matiere: [], classe: [] };
    if (!form.matiere.length || !form.classe.length) { toast.error(t('teachers_manager.messages.select_required')); return; }
    const pairs = form.matiere.flatMap(m => form.classe.map(c => ({ enseignant: teacher.id, matiere: Number(m), classe: Number(c) })));
    try {
      await Promise.all(pairs.map(p => api.post('/academics/enseignant-matieres/', p)));
      toast.success(t('teachers_manager.messages.add_assignments_success', { count: pairs.length }));
      setAddingAsgn(null);
      setNewAsgn(prev => ({ ...prev, [teacher.id]: { matiere: [], classe: [] } }));
      const res = await api.get(`/academics/enseignant-matieres/?enseignant=${teacher.id}`);
      setDetailData(prev => ({ ...prev, [teacher.id]: { ...prev[teacher.id], assignments: res.data.results || res.data } }));
    } catch { toast.error(t('teachers_manager.messages.add_assignments_error')); }
  };

  const filtered = teachers.filter(t => {
    const name = buildName(t.first_name, t.last_name, t.email, '').toLowerCase();
    return (name + t.specialite).toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('teachers_manager.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('teachers_manager.subtitle', { count: teachers.length })}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder={t('teachers_manager.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400">{t('common.no_data')}</div>}

        {filtered.map(teacher => {
          const isExpanded = expandedId === teacher.id;
          const detail = detailData[teacher.id];
          const form = newAsgn[teacher.id] || { matiere: [], classe: [] };
          const name = buildName(teacher.first_name, teacher.last_name, teacher.email, `Enseignant #${teacher.id}`);
          const ini = (teacher.first_name?.[0] || teacher.email?.[0] || 'E').toUpperCase() + (teacher.last_name?.[0] || '').toUpperCase();

          return (
            <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {}
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base shrink-0">
                  {ini}
                </div>

                {}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-base truncate">{name}</p>
                  <p className="text-xs text-slate-500">{teacher.email || '—'}</p>
                  <p className="text-xs text-slate-400">{t('teachers_manager.specialty')} : {teacher.specialite || t('common.no_data')}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${teacher.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <button onClick={() => startEdit(teacher)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title={t('common.edit')}><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => toggle(teacher)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-4">
                  {detail?.loading ? <div className="flex justify-center py-6"><Spinner /></div> : (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <BookOpen className="w-4 h-4 text-blue-500" /> {t('teachers_manager.assignments')} ({detail?.assignments.length ?? 0})
                        </h4>
                        <button onClick={() => setAddingAsgn(addingAsgn === teacher.id ? null : teacher.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90">
                          <Plus className="w-3 h-3" /> {t('common.add')}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {detail?.assignments.length === 0 && <p className="text-xs text-slate-400 italic">{t('teachers_manager.no_assignments')}</p>}
                        {detail?.assignments.map(a => {
                          const { mName, cName } = resolveName(a);
                          return (
                            <div key={a.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-medium text-slate-700">
                              <BookOpen className="w-3 h-3 text-blue-400" />
                              <span>{mName}</span>
                              <span className="text-slate-300 mx-0.5">→</span>
                              <GraduationCap className="w-3 h-3 text-indigo-400" />
                              <span>{cName}</span>
                              <button onClick={() => deleteAssignment(teacher.id, a.id)} className="text-red-400 hover:text-red-600 ml-1"><X className="w-3 h-3" /></button>
                            </div>
                          );
                        })}
                      </div>

                      {addingAsgn === teacher.id && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{t('teachers_manager.add_assignments')}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-slate-500 mb-1 block">{t('teachers_manager.select_subjects')} <span className="text-slate-400">(Ctrl = multi)</span></label>
                              <select multiple size={Math.min(matieres.length, 6)} value={form.matiere}
                                onChange={e => { const v = Array.from(e.target.selectedOptions, o => o.value); setNewAsgn(p => ({ ...p, [teacher.id]: { ...form, matiere: v } })); }}
                                className="w-full border border-slate-200 rounded-lg text-sm p-1 focus:ring-2 focus:ring-primary/20">
                                {matieres.map(m => <option key={m.id} value={String(m.id)}>{m.nom} (coeff. {m.coefficient})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 mb-1 block">{t('teachers_manager.select_classes')} <span className="text-slate-400">(Ctrl = multi)</span></label>
                              <select multiple size={Math.min(classes.length, 6)} value={form.classe}
                                onChange={e => { const v = Array.from(e.target.selectedOptions, o => o.value); setNewAsgn(p => ({ ...p, [teacher.id]: { ...form, classe: v } })); }}
                                className="w-full border border-slate-200 rounded-lg text-sm p-1 focus:ring-2 focus:ring-primary/20">
                                {classes.map(c => <option key={c.id} value={String(c.id)}>{c.nom} — {c.niveau}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => addAssignments(teacher)} className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90">{t('common.confirm')}</button>
                            <button onClick={() => setAddingAsgn(null)} className="px-4 py-1.5 text-slate-500 text-xs hover:bg-slate-100 rounded-lg">{t('common.cancel')}</button>
                          </div>
                        </div>
                      )}
                    </>
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
        title={t('common.edit')}
        maxWidth="md"
      >
        <form onSubmit={saveEdit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.first_name')}</label>
              <input
                value={editForm.first_name}
                onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.signup.last_name')}</label>
              <input
                value={editForm.last_name}
                onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('auth.login.email')}</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('teachers_manager.specialty')}</label>
            <input
              value={editForm.specialite}
              onChange={e => setEditForm(f => ({ ...f, specialite: e.target.value }))}
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