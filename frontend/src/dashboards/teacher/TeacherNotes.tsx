import { useEffect, useState } from 'react';
import { Search, Plus, FileText, Users, ChevronRight, BookOpen, Clock, Calendar, CheckCircle2, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
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
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  code_apogee: string;
}

export default function TeacherNotes() {
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [grades, setGrades] = useState<Record<number, { note: string; comment: string; absent: boolean }>>({});
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    type: 'CC',
    date: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    note_max: 20,
    matiere: '',
    classe: '',
    periode: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evalRes, periodRes, assignRes] = await Promise.all([
        api.get('/grades/evaluations/?only_my_evaluations=true'),
        api.get('/academics/periodes/'),
        api.get('/academics/enseignant-matieres/')
      ]);
      setEvaluations(evalRes.data.results || evalRes.data);
      setPeriodes(periodRes.data.results || periodRes.data);
      setAssignments(assignRes.data.results || assignRes.data);
    } catch (error) {
      toast.error(t('teacher_notes.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [t]);

  const handleOpenGradeModal = async (evaluation: Evaluation) => {
    setSelectedEval(evaluation);
    setLoadingStudents(true);
    setIsGradeModalOpen(true);
    try {
      // 1. Fetch students in the class
      const studentsRes = await api.get(`/accounts/etudiants/?classe=${evaluation.classe}`);
      const studentsList = studentsRes.data.results || studentsRes.data;
      setStudents(studentsList);

      // 2. Fetch existing grades for this evaluation
      const gradesRes = await api.get(`/grades/notes/?evaluation=${evaluation.id}`);
      const existingGrades = gradesRes.data.results || gradesRes.data;

      // 3. Initialize grades state
      const initialGrades: Record<number, { note: string; comment: string; absent: boolean }> = {};
      studentsList.forEach((s: Student) => {
        const existing = existingGrades.find((g: any) => g.etudiant === s.id);
        initialGrades[s.id] = {
          note: existing?.valeur_note?.toString() || '',
          comment: existing?.commentaire || '',
          absent: existing?.est_absent || false
        };
      });
      setGrades(initialGrades);
    } catch (error) {
      toast.error(t('teacher_notes.messages.load_students_error'));
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedEval) return;
    setIsActionLoading(true);
    try {
      const promises = Object.entries(grades).map(([studentId, data]) => {
        const payload = {
          evaluation: selectedEval.id,
          etudiant: parseInt(studentId),
          valeur_note: data.absent ? null : (data.note ? parseFloat(data.note) : null),
          commentaire: data.comment,
          est_absent: data.absent
        };
        return api.post('/grades/notes/save_grade/', payload);
      });

      await Promise.all(promises);
      toast.success(t('teacher_notes.messages.save_success'));
      setIsGradeModalOpen(false);
    } catch (error) {
      toast.error(t('teacher_notes.messages.save_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateEval = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const assignment = assignments.find(a => a.matiere === parseInt(formData.matiere) && a.classe === parseInt(formData.classe));
      
      const payload = {
        ...formData,
        matiere: parseInt(formData.matiere),
        classe: parseInt(formData.classe),
        periode: formData.periode ? parseInt(formData.periode) : null,
        enseignant: assignment?.enseignant // L'API s'attend à l'ID de l'enseignant
      };
      
      await api.post('/grades/evaluations/', payload);
      toast.success(t('teacher_notes.messages.create_success'));
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t('teacher_notes.messages.create_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredEvals = evaluations.filter(e => 
    e.matiere_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.classe_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('teacher_notes.title')}</h1>
          <p className="text-slate-500 mt-1">{t('teacher_notes.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('teacher_notes.new_evaluation')}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('teacher_notes.evaluations_title')}
          </h3>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('teacher_notes.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table columns={[t('evaluations_manager.table.evaluation'), t('evaluations_manager.table.class'), t('evaluations_manager.table.planning'), t('common.actions')]} isEmpty={filteredEvals.length === 0}>
            {filteredEvals.map((evaluation) => (
              <tr key={evaluation.id} className="hover:bg-slate-50/50 transition-colors group">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{evaluation.matiere_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{evaluation.type_display}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2 text-slate-600 font-bold">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{evaluation.classe_name}</span>
                  </div>
                </Td>
                <Td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {evaluation.date}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {evaluation.heure_debut?.substring(0,5)} - {evaluation.heure_fin?.substring(0,5)}
                    </div>
                  </div>
                </Td>
                <Td>
                  <button 
                    onClick={() => handleOpenGradeModal(evaluation)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-primary hover:text-primary transition-all group-hover:shadow-md"
                  >
                    {t('teacher_notes.enter_grades')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Td>
              </tr>
            ))}
          </Table>
          {filteredEvals.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">
              {t('teacher_notes.no_evaluations')}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={t('teacher_notes.new_evaluation')}>
        <form onSubmit={handleCreateEval} className="space-y-6 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('teacher_notes.form.type')}</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
              >
                <option value="CC">{t('evaluations_manager.types.CC')}</option>
                <option value="Examen">{t('evaluations_manager.types.Examen')}</option>
                <option value="TP">{t('evaluations_manager.types.TP')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('evaluations_manager.form.max_note')}</label>
              <input 
                type="number" 
                value={formData.note_max}
                onChange={(e) => setFormData({...formData, note_max: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('affectations_manager.table.subject')}</label>
            <select 
              required
              value={formData.matiere}
              onChange={(e) => setFormData({...formData, matiere: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
            >
              <option value="">{t('affectations_manager.select_subject')}</option>
              {[...new Set(assignments.map(a => JSON.stringify({id: a.matiere, nom: a.matiere_name})))].map(mStr => {
                const m = JSON.parse(mStr);
                return <option key={m.id} value={m.id}>{m.nom}</option>;
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('affectations_manager.table.class')}</label>
            <select 
              required
              value={formData.classe}
              onChange={(e) => setFormData({...formData, classe: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold disabled:opacity-50"
              disabled={!formData.matiere}
            >
              <option value="">{t('affectations_manager.select_class')}</option>
              {assignments.filter(a => a.matiere === parseInt(formData.matiere)).map(a => (
                <option key={a.classe} value={a.classe}>{a.classe_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('evaluations_manager.form.period')}</label>
            <select 
              required
              value={formData.periode}
              onChange={(e) => setFormData({...formData, periode: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
            >
              <option value="">{t('evaluations_manager.form.select_period')}</option>
              {periodes.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('teacher_notes.form.date')}</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('teacher_notes.form.start_time')}</label>
              <input 
                type="time" 
                value={formData.heure_debut}
                onChange={(e) => setFormData({...formData, heure_debut: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('teacher_notes.form.end_time')}</label>
              <input 
                type="time" 
                value={formData.heure_fin}
                onChange={(e) => setFormData({...formData, heure_fin: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all">
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isActionLoading}
              className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
              {isActionLoading && <Spinner className="w-4 h-4 text-white" />}
              {t('common.add')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade Entry Modal */}
      <Modal 
        isOpen={isGradeModalOpen} 
        onClose={() => setIsGradeModalOpen(false)} 
        title={t('teacher_notes.grade_modal.title', { matiere: selectedEval?.matiere_name, classe: selectedEval?.classe_name })}
        maxWidth="2xl"
      >
        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">{t('teacher_notes.grade_modal.max_note', { count: selectedEval?.note_max })}</p>
                <p className="text-sm font-bold text-indigo-900">{selectedEval?.type_display} - {selectedEval?.date}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left border-b border-slate-100">
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('teacher_notes.grade_modal.student')}</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">{t('teacher_notes.grade_modal.grade')}</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('teacher_notes.grade_modal.comment')}</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">{t('common.absent')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingStudents ? (
                  <tr><td colSpan={4} className="py-12 text-center"><Spinner /></td></tr>
                ) : students.map((student) => (
                  <tr key={student.id} className={`group transition-colors ${grades[student.id]?.absent ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${grades[student.id]?.absent ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-none">{student.first_name} {student.last_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{student.code_apogee}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.25"
                          min="0"
                          max={selectedEval?.note_max}
                          disabled={grades[student.id]?.absent}
                          value={grades[student.id]?.note || ''}
                          onChange={(e) => setGrades(prev => ({...prev, [student.id]: {...prev[student.id], note: e.target.value}}))}
                          className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100"
                        />
                        {!grades[student.id]?.absent && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">/20</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <input 
                        type="text" 
                        placeholder={t('teacher_notes.grade_modal.comment')}
                        value={grades[student.id]?.comment || ''}
                        onChange={(e) => setGrades(prev => ({...prev, [student.id]: {...prev[student.id], comment: e.target.value}}))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => setGrades(prev => ({...prev, [student.id]: {...prev[student.id], absent: !prev[student.id].absent, note: ''}}))}
                        className={`p-2 rounded-xl transition-all ${grades[student.id]?.absent ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}
                        title={t('teacher_notes.grade_modal.absent_long')}
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all">
              {t('common.cancel')}
            </button>
            <button 
              onClick={handleSaveGrades}
              disabled={isActionLoading}
              className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
              {isActionLoading && <Spinner className="w-4 h-4 text-white" />}
              {t('teacher_notes.grade_modal.submit')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}