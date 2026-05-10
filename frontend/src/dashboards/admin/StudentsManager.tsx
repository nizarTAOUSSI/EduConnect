import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, UserCheck, Clock, Edit2, X, Check, FileText } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

interface User { id: number; first_name: string; last_name: string; email: string; is_active: boolean; }
interface Student {
  id: number; utilisateur: number; code_apogee: string; classe: number | null; is_active: boolean;
  first_name: string; last_name: string; email: string; nom_complet: string; classe_name: string | null;
}
interface Note {
  id: number;
  valeur_note: number;
  est_absent: boolean;
  evaluation_details?: {
    matiere_name: string;
    matiere_coefficient: number;
    type_display: string;
    date: string;
  };
}
interface Classe { id: number; nom: string; niveau: string; nb_etudiants?: number; }
interface Absence { 
  id: number; 
  date: string; 
  justifiee: boolean; 
  duree_heures: number; 
  motif?: string;
  enseignant_matiere_details?: {
    matiere_name: string;
    enseignant_name: string;
  };
  seance_details?: {
    heure_debut: string;
    heure_fin: string;
    salle_name?: string;
  };
}
interface ParentInfo { id: number; nom_complet: string; email: string; enfants: number[]; }
interface ParentOption { id: number; nom_complet: string; email: string; enfants: number[]; }

interface RawStudent {
  id: number;
  utilisateur: number;
  code_apogee: string;
  classe: number;
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
  nom_complet?: string;
  classe_name?: string;
}

interface RawParent {
  id: number;
  utilisateur: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  nom_complet?: string;
  enfants: (number | { id: number })[];
}

const buildName = (first: string, last: string, email: string, fallback: string) => {
  const full = `${first} ${last}`.trim();
  return full || email || fallback;
};

const initials = (first: string, last: string, email: string) => {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
};

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<Record<number, { absences: Absence[]; notes: Note[]; parents: ParentInfo[]; availableParents: ParentOption[]; loading: boolean }>>({});
  const [selectedParentIds, setSelectedParentIds] = useState<Record<number, number | ''>>({});
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', code_apogee: '', new_class: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [justifyingAbsence, setJustifyingAbsence] = useState<{ student: Student; absence: Absence } | null>(null);
  const [justificationMotif, setJustificationMotif] = useState('');
  const [viewingAbsencesStudent, setViewingAbsencesStudent] = useState<Student | null>(null);
  const [activeTab, setViewingTab] = useState<'absences' | 'notes'>('absences');
  const [absenceSearch, setAbsenceSearch] = useState('');
  const [absenceDateFilter, setAbsenceDateFilter] = useState('');

  // Assignments modal state (Teachers & Subjects)
  // const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false);
  // const [selectedClassAssignments, setSelectedClassAssignments] = useState<any[]>([]);
  // const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  // const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');

  // Student list modal state
  // const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  // const [selectedClassStudents, setSelectedClassStudents] = useState<any[]>([]);
  // const [studentsLoading, setStudentsLoading] = useState(false);
  // const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // const resolveClassName = useCallback((student: Student) => {
  //   if (student.classe_name?.trim()) return student.classe_name.trim();
  //   if (student.classe !== null) {
  //     const cls = classes.find(c => c.id === student.classe);
  //     return cls ? `${cls.nom} — ${cls.niveau}` : `Classe #${student.classe}`;
  //   }
  //   return null;
  // }, [classes]);

  // const fetchClassStudents = async (classe: any) => {
  //   try {
  //     setViewingAbsencesStudent({ id: -2000 - classe.id, first_name: 'Classe', last_name: classe.nom } as any);
  //     setStudentsLoading(true);
  //     setIsStudentsModalOpen(true);
  //     setStudentSearchTerm('');
  //     const res = await api.get(`/accounts/etudiants/?classe=${classe.id}`);
  //     setSelectedClassStudents(res.data.results || res.data);
  //   } catch (error) {
  //     toast.error('Erreur lors du chargement des étudiants');
  //   } finally {
  //     setStudentsLoading(false);
  //   }
  // };

  // const fetchClassAssignments = async (classe: any) => {
  //   try {
  //     setViewingAbsencesStudent({ id: -3000 - classe.id, first_name: 'Classe', last_name: classe.nom } as any);
  //     setAssignmentsLoading(true);
  //     setIsAssignmentsModalOpen(true);
  //     setAssignmentSearchTerm('');
  //     const res = await api.get(`/academics/enseignant-matieres/?classe=${classe.id}`);
  //     setSelectedClassAssignments(res.data.results || res.data);
  //   } catch (error) {
  //     toast.error('Erreur lors du chargement des affectations');
  //   } finally {
  //     setAssignmentsLoading(false);
  //   }
  // };

  const buildStudents = (rawStudents: RawStudent[], userMap: Map<number, User>, classeMap: Map<number, Classe>) => {
    return rawStudents.map((s: RawStudent) => {
      const user = userMap.get(s.utilisateur) || { first_name: '', last_name: '', email: '', is_active: true } as User;
      const cls = classeMap.get(s.classe) || null;
      const first = s.first_name || user.first_name || '';
      const last = s.last_name || user.last_name || '';
      const email = s.email || user.email || '';
      return {
        id: s.id,
        utilisateur: s.utilisateur,
        code_apogee: s.code_apogee || '',
        classe: s.classe ?? null,
        is_active: s.is_active ?? user.is_active ?? true,
        first_name: first,
        last_name: last,
        email: email,
        nom_complet: s.nom_complet?.trim() || buildName(first, last, email, ''),
        classe_name: s.classe_name || (cls ? cls.nom : null),
      };
    });
  };

  const loadAll = useCallback(async () => {
    const [sRes, cRes, uRes] = await Promise.all([
      api.get('/accounts/etudiants/'),
      api.get('/academics/classes/'),
      api.get('/accounts/utilisateurs/'),
    ]);
    const rawStudents: RawStudent[] = sRes.data.results || sRes.data;
    const rawClasses: Classe[] = cRes.data.results || cRes.data;
    const rawUsers: User[] = uRes.data.results || uRes.data;

    const userMap = new Map(rawUsers.map(u => [u.id, u]));
    const classeMap = new Map(rawClasses.map(c => [c.id, c]));

    setClasses(rawClasses);
    setStudents(buildStudents(rawStudents, userMap, classeMap));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await loadAll();
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadAll]);

  const loadDetail = async (student: Student) => {
    if (detailData[student.id]) return;
    setDetailData(prev => ({ ...prev, [student.id]: { absences: [], notes: [], parents: [], availableParents: [], loading: true } }));
    try {
      const [absRes, notesRes, parentsRes, usersRes] = await Promise.all([
        api.get(`/academics/absences/?etudiant=${student.id}`),
        api.get(`/grades/notes/?etudiant=${student.id}`),
        api.get('/accounts/parents/'),
        api.get('/accounts/utilisateurs/'),
      ]);
      const absences = absRes.data.results || absRes.data;
      const notes = notesRes.data.results || notesRes.data;
      const allParents: RawParent[] = parentsRes.data.results || parentsRes.data;
      const allUsers: User[] = usersRes.data.results || usersRes.data;
      const userMap = new Map(allUsers.map((u: User) => [u.id, u]));

      const parents: ParentInfo[] = allParents.map(parent => {
        const enfants = Array.isArray(parent.enfants)
          ? parent.enfants.map((e: { id: number } | number) => typeof e === 'object' ? e.id : e)
          : [];
        const pUser = userMap.get(parent.utilisateur) || { first_name: '', last_name: '', email: '' };
        const first = parent.first_name || pUser.first_name || '';
        const last  = parent.last_name  || pUser.last_name  || '';
        const email = parent.email      || pUser.email      || '';
        const nom = `${first} ${last}`.trim() || parent.nom_complet?.trim() || email || `Parent #${parent.id}`;
        return { id: parent.id, nom_complet: nom, email, enfants };
      });

      const linkedParents = parents.filter(parent => parent.enfants.includes(student.id));
      const availableParents = parents.filter(parent => !parent.enfants.includes(student.id));

      setDetailData(prev => ({ ...prev, [student.id]: { absences, notes, parents: linkedParents, availableParents, loading: false } }));
    } catch {
      setDetailData(prev => ({ ...prev, [student.id]: { absences: [], notes: [], parents: [], availableParents: [], loading: false } }));
    }
  };

  const toggle = (student: Student) => {
    if (expandedId === student.id) { setExpandedId(null); return; }
    setExpandedId(student.id);
    loadDetail(student);
  };

  const handleAttachParent = async (student: Student, parentId: number) => {
    const detail = detailData[student.id];
    if (!detail) return;
    const parent = detail.availableParents.find(p => p.id === parentId);
    if (!parent) return;

    try {
      setSavingStudentId(student.id);
      await api.patch(`/accounts/parents/${parent.id}/`, { enfants: [...parent.enfants, student.id] });
      setSelectedParentIds(prev => ({ ...prev, [student.id]: '' }));
      setDetailData(prev => ({ ...prev, [student.id]: { ...prev[student.id], loading: true } }));
      await loadDetail(student);
      toast.success('Parent rattaché à l’étudiant');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error(err);
      toast.error(err.response?.data?.detail || 'Impossible de rattacher le parent');
    } finally {
      setSavingStudentId(null);
    }
  };

  const handleDetachParent = async (student: Student, parent: ParentInfo) => {
    try {
      setSavingStudentId(student.id);
      const updatedChildren = parent.enfants.filter(id => id !== student.id);
      await api.patch(`/accounts/parents/${parent.id}/`, { enfants: updatedChildren });
      setDetailData(prev => ({ ...prev, [student.id]: { ...prev[student.id], loading: true } }));
      await loadDetail(student);
      toast.success('Parent détaché de l’étudiant');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      console.error(err);
      toast.error(err.response?.data?.detail || 'Impossible de détacher le parent');
    } finally {
      setSavingStudentId(null);
    }
  };

  const toggleAbsenceJustification = async (student: Student, absence: Absence, justify: boolean, motif: string = '') => {
    try {
      setIsActionLoading(true);
      await api.patch(`/academics/absences/${absence.id}/`, { justifiee: justify, motif: motif });
      
      setDetailData(prev => {
        const studentDetail = prev[student.id];
        if (!studentDetail) return prev;
        
        const updatedAbsences = studentDetail.absences.map(abs => 
          abs.id === absence.id ? { ...abs, justifiee: justify, motif: motif } : abs
        );
        
        return {
          ...prev,
          [student.id]: {
            ...studentDetail,
            absences: updatedAbsences
          }
        };
      });
      
      toast.success(justify ? 'Absence justifiée avec succès' : 'Absence marquée comme non justifiée');
      if (justifyingAbsence) {
        setJustifyingAbsence(null);
        setJustificationMotif('');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'absence');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAbsenceClick = (student: Student, abs: Absence) => {
    if (!abs.justifiee) {
      setJustifyingAbsence({ student, absence: abs });
      setJustificationMotif(abs.motif || '');
    } else {
      toggleAbsenceJustification(student, abs, false, '');
    }
  };

  const startEdit = (s: Student) => {
    setEditingStudent(s);
    setEditForm({
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      code_apogee: s.code_apogee,
      new_class: s.classe !== null ? String(s.classe) : '',
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsActionLoading(true);
    try {
      await api.patch(`/accounts/utilisateurs/${editingStudent.utilisateur}/`, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
      });
      await api.patch(`/accounts/etudiants/${editingStudent.id}/`, {
        code_apogee: editForm.code_apogee,
        classe: editForm.new_class ? Number(editForm.new_class) : null,
      });
      toast.success('Étudiant mis à jour');
      setIsEditModalOpen(false);
      setEditingStudent(null);
      setDetailData(prev => { const n = { ...prev }; delete n[editingStudent.id]; return n; });
      await loadAll();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const name = buildName(s.first_name, s.last_name, s.email, '').toLowerCase();
    const matchSearch = (name + s.email + s.code_apogee).includes(search.toLowerCase());
    const matchClass = classFilter === 'all' || String(s.classe) === classFilter;
    return matchSearch && matchClass;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestion des Étudiants</h1>
        <p className="text-slate-500 text-sm mt-1">{students.length} étudiant(s) enregistrés</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher par nom, email, code apogée…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={String(c.id)}>{c.nom} — {c.niveau}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400">Aucun étudiant trouvé.</div>}

        {filtered.map(student => {
          const isExpanded = expandedId === student.id;
          const detail = detailData[student.id];
          // const className = resolveClassName(student);
          const name = buildName(student.first_name, student.last_name, student.email, `Étudiant #${student.id}`);
          const ini = initials(student.first_name, student.last_name, student.email);

          return (
            <div key={student.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {}
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base shrink-0">
                  {ini}
                </div>

                {}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-base truncate">{name}</p>
                  <p className="text-xs text-slate-500">{student.email}</p>
                  <p className="text-xs text-slate-400">Apogée : {student.code_apogee}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setViewingAbsencesStudent(student);
                        setViewingTab('absences');
                        loadDetail(student);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Absences"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setViewingAbsencesStudent(student);
                        setViewingTab('notes');
                        loadDetail(student);
                      }}
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      title="Notes"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => startEdit(student)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggle(student)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  {detail?.loading ? (
                    <div className="flex justify-center py-6"><Spinner /></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                          <UserCheck className="w-4 h-4 text-indigo-500" /> Parent(s) rattaché(s)
                        </h4>
                        {detail?.parents.length ? (
                          <div className="space-y-3">
                            {detail.parents.map(parent => (
                              <div key={parent.id} className="bg-white rounded-lg px-3 py-3 border border-slate-100 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{parent.nom_complet}</p>
                                  <p className="text-xs text-slate-500">{parent.email}</p>
                                </div>
                                <button
                                  onClick={() => handleDetachParent(student, parent)}
                                  disabled={savingStudentId === student.id}
                                  className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition"
                                >
                                  Détacher
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Aucun parent associé.</p>
                        )}

                        <div className="mt-4">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ajouter un parent</label>
                          <div className="mt-2 flex gap-2">
                            <select
                              value={selectedParentIds[student.id] ?? ''}
                              onChange={e => setSelectedParentIds(prev => ({ ...prev, [student.id]: Number(e.target.value) || '' }))}
                              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                            >
                              <option value="">Sélectionner un parent</option>
                              {detail?.availableParents.map(parent => (
                                <option key={parent.id} value={parent.id}>
                                  {parent.nom_complet} — {parent.email}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => selectedParentIds[student.id] && handleAttachParent(student, selectedParentIds[student.id] as number)}
                              disabled={!selectedParentIds[student.id] || savingStudentId === student.id}
                              className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                      
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
        title="Modifier l'étudiant"
        maxWidth="md"
      >
        <form onSubmit={saveEdit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Prénom</label>
              <input
                value={editForm.first_name}
                onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Nom</label>
              <input
                value={editForm.last_name}
                onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Adresse Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Code Apogée</label>
            <input
              value={editForm.code_apogee}
              onChange={e => setEditForm(f => ({ ...f, code_apogee: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Classe</label>
            <select
              value={editForm.new_class}
              onChange={e => setEditForm(f => ({ ...f, new_class: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-slate-700"
            >
              <option value="">— Aucune classe —</option>
              {classes.map(c => <option key={c.id} value={String(c.id)}>{c.nom} — {c.niveau}</option>)}
            </select>
          </div>
          
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!viewingAbsencesStudent}
        onClose={() => {
          setViewingAbsencesStudent(null);
          setAbsenceSearch('');
          setAbsenceDateFilter('');
          setViewingTab('absences');
        }}
        title={viewingAbsencesStudent ? `Dossier Étudiant : ${viewingAbsencesStudent.first_name} ${viewingAbsencesStudent.last_name}` : 'Détails'}
        maxWidth="2xl"
      >
        {viewingAbsencesStudent && detailData[viewingAbsencesStudent.id]?.loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : viewingAbsencesStudent && detailData[viewingAbsencesStudent.id] ? (
          <div className="space-y-6">
            {/* Tabs Selector */}
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
              <button 
                onClick={() => setViewingTab('absences')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'absences' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Absences
              </button>
              <button 
                onClick={() => setViewingTab('notes')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Notes & Évaluations
              </button>
            </div>

            {activeTab === 'absences' ? (
              <>
                {/* Statistiques épurées Absences */}
                <div className="flex flex-wrap items-center gap-6 px-2 py-1 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{detailData[viewingAbsencesStudent.id].absences.length}</span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Absences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600">{detailData[viewingAbsencesStudent.id].absences.filter(a => a.justifiee).length}</span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Justifiées</span>
                  </div>
                </div>

                {/* Filtres homogènes */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Filtrer par matière ou prof..." 
                      value={absenceSearch}
                      onChange={(e) => setAbsenceSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                    />
                  </div>
                  <div className="relative w-40">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      value={absenceDateFilter}
                      onChange={(e) => setAbsenceDateFilter(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-medium text-slate-600"
                    />
                  </div>
                </div>

                {/* Liste Absences */}
                <div className="max-h-100overflow-y-auto pr-1 custom-scrollbar">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {detailData[viewingAbsencesStudent.id].absences.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm italic">Aucune absence.</div>
                    ) : (
                      detailData[viewingAbsencesStudent.id].absences.map((abs, index) => (
                        <div key={abs.id} className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${index !== 0 ? 'border-t border-slate-100' : ''}`}>
                          <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="w-14 shrink-0">
                              <p className="text-sm font-bold text-slate-900 leading-none">{abs.date.split('-')[2]}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{new Date(abs.date).toLocaleString('fr-fr', { month: 'short' }).replace('.', '')}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{abs.enseignant_matiere_details?.matiere_name}</p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{abs.enseignant_matiere_details?.enseignant_name} • {abs.seance_details?.heure_debut}-{abs.seance_details?.heure_fin}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${abs.justifiee ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{abs.justifiee ? 'Justifiée' : 'Non justifiée'}</span>
                            <button onClick={() => handleAbsenceClick(viewingAbsencesStudent, abs)} className={`p-2 rounded-lg transition-all ${abs.justifiee ? 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                              {abs.justifiee ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Statistiques épurées Notes */}
                <div className="flex flex-wrap items-center gap-6 px-2 py-1 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-600">{detailData[viewingAbsencesStudent.id].notes.length}</span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Évaluations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {(detailData[viewingAbsencesStudent.id].notes.reduce((sum, n) => sum + (n.valeur_note || 0), 0) / 
                       (detailData[viewingAbsencesStudent.id].notes.filter(n => !n.est_absent).length || 1)).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Moyenne Simple</span>
                  </div>
                </div>

                {/* Liste Notes */}
                <div className="max-h-100 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    {detailData[viewingAbsencesStudent.id].notes.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm italic">Aucune note enregistrée.</div>
                    ) : (
                      detailData[viewingAbsencesStudent.id].notes.map((note, index) => (
                        <div key={note.id} className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${index !== 0 ? 'border-t border-slate-100' : ''}`}>
                          <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black shadow-sm shrink-0">
                              {note.est_absent ? 'ABS' : note.valeur_note}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{note.evaluation_details?.matiere_name}</p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5 flex flex-wrap items-center gap-x-2">
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">{note.evaluation_details?.type_display}</span>
                                <span>Coeff: {note.evaluation_details?.matiere_coefficient}</span>
                                <span className="text-slate-300">•</span>
                                <span>{note.evaluation_details?.date}</span>
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 ml-4 flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">/ 20</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setViewingAbsencesStudent(null);
                  setViewingTab('absences');
                }}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!justifyingAbsence}
        onClose={() => {
          setJustifyingAbsence(null);
          setJustificationMotif('');
        }}
        title="Justifier l'absence"
        maxWidth="sm"
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (justifyingAbsence) {
              toggleAbsenceJustification(justifyingAbsence.student, justifyingAbsence.absence, true, justificationMotif);
            }
          }} 
          className="space-y-6"
        >
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex items-start gap-3">
            <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Justification pour l'absence du <strong>{justifyingAbsence?.absence.date}</strong>.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Motif de la justification</label>
            <textarea
              value={justificationMotif}
              onChange={e => setJustificationMotif(e.target.value)}
              required
              rows={3}
              placeholder="Ex: Certificat médical, convocation..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setJustifyingAbsence(null);
                setJustificationMotif('');
              }}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Confirmer
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}