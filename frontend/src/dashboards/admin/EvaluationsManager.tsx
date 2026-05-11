import { useState, useEffect } from 'react';
import { Search, Trash2, FileText, Calendar, BookOpen, GraduationCap, User, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Table, { Td } from '../../components/ui/Table';

interface Evaluation {
  id: number;
  type: string;
  type_display: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  note_max: number;
  matiere: number;
  matiere_name: string;
  classe: number;
  classe_name: string;
  enseignant: number;
  enseignant_name: string;
  salle: number | null;
  periode: number | null;
  periode_name?: string;
}

interface Note {
  id: number;
  etudiant: number;
  valeur_note: number | null;
  commentaire: string;
  est_absent: boolean;
  etudiant_name?: string;
  etudiant_email?: string;
  etudiant_details?: {
    first_name: string;
    last_name: string;
    email: string;
    nom_complet: string;
  };
}

interface Assignment {
  id: number;
  enseignant: number;
  matiere: number;
  classe: number;
  enseignant_name?: string;
  matiere_name?: string;
  classe_name?: string;
}

export default function EvaluationsManager() {
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    classe: '',
    teacher: '',
    search: ''
  });

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evalToDelete, setEvalToDelete] = useState<number | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'CC',
    date: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    note_max: 20,
    matiere: '',
    enseignant: '',
    classe: '',
    salle: '',
    periode: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evalRes, classRes, teacherRes, matRes, salleRes, assignRes, periodRes] = await Promise.all([
        api.get('/grades/evaluations/'),
        api.get('/academics/classes/'),
        api.get('/accounts/enseignants/'),
        api.get('/academics/matieres/'),
        api.get('/academics/salles/'),
        api.get('/academics/enseignant-matieres/'),
        api.get('/academics/periodes/'),
      ]);
      
      const evalData = evalRes.data.results !== undefined ? evalRes.data.results : evalRes.data;
      const classData = classRes.data.results !== undefined ? classRes.data.results : classRes.data;
      const teacherData = teacherRes.data.results !== undefined ? teacherRes.data.results : teacherRes.data;
      const matData = matRes.data.results !== undefined ? matRes.data.results : matRes.data;
      const salleData = salleRes.data.results !== undefined ? salleRes.data.results : salleRes.data;
      const assignData = assignRes.data.results !== undefined ? assignRes.data.results : assignRes.data;
      const periodData = periodRes.data.results !== undefined ? periodRes.data.results : periodRes.data;
      
      setEvaluations(Array.isArray(evalData) ? evalData : []);
      setClasses(Array.isArray(classData) ? classData : []);
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setMatieres(Array.isArray(matData) ? matData : []);
      setSalles(Array.isArray(salleData) ? salleData : []);
      setAssignments(Array.isArray(assignData) ? assignData : []);
      setPeriodes(Array.isArray(periodData) ? periodData : []);
    } catch (error) {
      toast.error(t('evaluations_manager.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (evaluation: Evaluation) => {
    try {
      setNotesLoading(true);
      setSelectedEval(evaluation);
      setIsNotesModalOpen(true);
      const res = await api.get(`/grades/notes/?evaluation=${evaluation.id}`);
      setNotes(res.data.results || res.data);
    } catch (error) {
      toast.error(t('evaluations_manager.messages.load_notes_error'));
    } finally {
      setNotesLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setEvalToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!evalToDelete) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/grades/evaluations/${evalToDelete}/`);
      toast.success(t('evaluations_manager.messages.delete_success'));
      setIsDeleteModalOpen(false);
      setEvalToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(t('evaluations_manager.messages.delete_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const payload = {
        ...formData,
        matiere: parseInt(formData.matiere),
        enseignant: parseInt(formData.enseignant),
        classe: parseInt(formData.classe),
        salle: formData.salle ? parseInt(formData.salle) : null,
        periode: formData.periode ? parseInt(formData.periode) : null,
        note_max: parseFloat(formData.note_max.toString())
      };
      await api.post('/grades/evaluations/', payload);
      toast.success(t('evaluations_manager.messages.save_success'));
      setIsCreateModalOpen(false);
      fetchData();
      setFormData({
        type: 'CC',
        date: new Date().toISOString().split('T')[0],
        heure_debut: '',
        heure_fin: '',
        note_max: 20,
        matiere: '',
        enseignant: '',
        classe: '',
        salle: '',
        periode: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || t('evaluations_manager.messages.save_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Helper for dependent selects
  const getTeachersForMatiere = () => {
    if (!formData.matiere) return [];
    const matId = parseInt(formData.matiere);
    const relevantAssigns = assignments.filter(a => a.matiere === matId);
    const teacherIds = [...new Set(relevantAssigns.map(a => a.enseignant))];
    return teachers.filter(t => teacherIds.includes(t.id));
  };

  const getClassesForTeacherMatiere = () => {
    if (!formData.matiere || !formData.enseignant) return [];
    const matId = parseInt(formData.matiere);
    const teachId = parseInt(formData.enseignant);
    const relevantAssigns = assignments.filter(a => a.matiere === matId && a.enseignant === teachId);
    const classIds = relevantAssigns.map(a => a.classe);
    return classes.filter(c => classIds.includes(c.id));
  };

  const filteredEvaluations = evaluations.filter(e => {
    const matchClass = !filters.classe || e.classe === parseInt(filters.classe);
    const matchTeacher = !filters.teacher || e.enseignant === parseInt(filters.teacher);
    
    const search = filters.search.toLowerCase();
    const matiere = (e.matiere_name || '').toLowerCase();
    const teacher = (e.enseignant_name || '').toLowerCase();
    
    const matchSearch = !filters.search || 
      matiere.includes(search) ||
      teacher.includes(search);
      
    return matchClass && matchTeacher && matchSearch;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('evaluations_manager.title')}</h1>
          <p className="text-slate-500 mt-1">{t('evaluations_manager.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('evaluations_manager.add_evaluation')}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('evaluations_manager.search_placeholder')}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <select
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              value={filters.classe}
              onChange={(e) => setFilters({ ...filters, classe: e.target.value })}
            >
              <option value="">{t('common.all_classes')}</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
              ))}
            </select>
            <select
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              value={filters.teacher}
              onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
            >
              <option value="">{t('teachers_manager.search_placeholder')}</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-8">
          <Table columns={[t('evaluations_manager.table.evaluation'), t('evaluations_manager.table.class'), t('evaluations_manager.table.teacher'), t('evaluations_manager.table.planning'), t('common.actions')]} isEmpty={filteredEvaluations.length === 0}>
            {filteredEvaluations.map((evalItem) => (
              <tr key={evalItem.id} className="hover:bg-slate-50/50 transition-colors group">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{evalItem.matiere_name || `Matière #${evalItem.matiere}`}</p>
                      <p className="text-xs text-slate-500 font-medium">{evalItem.type_display}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2 text-slate-600 font-bold">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>{evalItem.classe_name || `Classe #${evalItem.classe}`}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2 text-slate-600 font-bold">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{evalItem.enseignant_name || 'Non assigné'}</span>
                  </div>
                </Td>
                <Td>
                  {evalItem.date ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {evalItem.date}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter ml-5">
                        {evalItem.heure_debut?.substring(0, 5)} - {evalItem.heure_fin?.substring(0, 5)}
                      </div>
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded uppercase tracking-wider">{t('evaluations_manager.not_planned')}</span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => fetchNotes(evalItem)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      title={t('evaluations_manager.view_notes')}
                    >
                      <BookOpen className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(evalItem.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title={t('evaluations_manager.delete_forever')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      {/* Create Evaluation Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title={t('evaluations_manager.add_evaluation')}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('evaluations_manager.form.type')}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all"
                required
              >
                <option value="CC">{t('evaluations_manager.types.CC')}</option>
                <option value="Examen">{t('evaluations_manager.types.Examen')}</option>
                <option value="TP">{t('evaluations_manager.types.TP')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('evaluations_manager.form.max_note')}</label>
              <input
                type="number"
                value={formData.note_max}
                onChange={(e) => setFormData({...formData, note_max: parseFloat(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('affectations_manager.table.subject')}</label>
            <select
              value={formData.matiere}
              onChange={(e) => setFormData({...formData, matiere: e.target.value, enseignant: '', classe: ''})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all"
              required
            >
              <option value="">{t('affectations_manager.select_subject')}</option>
              {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('evaluations_manager.form.period')}</label>
            <select
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all duration-200"
              value={formData.periode}
              onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
            >
              <option value="">{t('evaluations_manager.form.select_period')}</option>
              {periodes.map(p => (
                <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('affectations_manager.table.teacher')}</label>
              <select
                value={formData.enseignant}
                onChange={(e) => setFormData({...formData, enseignant: e.target.value, classe: ''})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-50"
                required
                disabled={!formData.matiere}
              >
                <option value="">{t('affectations_manager.table.teacher')}</option>
                {getTeachersForMatiere().map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('affectations_manager.table.class')}</label>
              <select
                value={formData.classe}
                onChange={(e) => setFormData({...formData, classe: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-50"
                required
                disabled={!formData.enseignant}
              >
                <option value="">{t('affectations_manager.table.class')}</option>
                {getClassesForTeacherMatiere().map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('evaluations_manager.form.planning_opt')}</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <input
                type="time"
                value={formData.heure_debut}
                onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <input
                type="time"
                value={formData.heure_fin}
                onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('evaluations_manager.form.room_opt')}</label>
            <select
              value={formData.salle}
              onChange={(e) => setFormData({...formData, salle: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all"
            >
              <option value="">{t('evaluations_manager.form.select_room')}</option>
              {salles.map(s => <option key={s.id} value={s.id}>{s.nom} ({s.capacite} places)</option>)}
            </select>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t">
            <button 
              type="button" 
              onClick={() => setIsCreateModalOpen(false)} 
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isActionLoading}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('common.add')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        title={`Notes - ${selectedEval?.matiere_name} (${selectedEval?.classe_name})`}
        maxWidth="2xl"
      >
        {notesLoading ? (
          <div className="flex justify-center py-12"><Spinner className="text-indigo-600" /></div>
        ) : (
          <div className="space-y-6">
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {notes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-3xl">
                  {t('evaluations_manager.no_notes')}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                          {(note.etudiant_name?.[0] || 'E')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {note.etudiant_name || `Étudiant #${note.etudiant}`}
                          </p>
                          <p className="text-xs text-slate-400">{note.etudiant_email || 'Email non disponible'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {note.est_absent ? (
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-black rounded-full uppercase">{t('common.absent')}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xl font-black text-slate-900">{note.valeur_note}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">/ {selectedEval?.note_max}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('evaluations_manager.delete_forever')}
        message={t('common.delete_confirm')}
        confirmLabel={t('common.delete')}
        variant="danger"
        isLoading={isActionLoading}
      />
    </div>
  );
}
