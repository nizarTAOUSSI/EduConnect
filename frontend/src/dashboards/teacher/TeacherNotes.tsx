import { useEffect, useState } from 'react';
import { FileSpreadsheet, Plus, Edit2, BookOpen, Trash2, Search } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

interface Evaluation {
  id: number;
  type: string;
  date: string;
  heure_debut?: string;
  heure_fin?: string;
  note_max: number;
  matiere: number;
  classe: number;
  matiere_name?: string;
  classe_name?: string;
}

interface Note {
  id: number;
  evaluation: number;
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
  };
}

interface Assignment {
  id: number;
  matiere: number;
  classe: number;
  matiere_name?: string;
  classe_name?: string;
}

interface Student {
  id: number;
  utilisateur: number;
  code_apogee: string;
  classe: number | null;
  first_name: string;
  last_name: string;
  email: string;
  classe_name: string | null;
}

export default function TeacherNotes() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<number, Student[]>>({});
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateEvalModalOpen, setIsCreateEvalModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evalToDelete, setEvalToDelete] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Filters
  const [classFilter, setClassFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<{
    type: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    note_max: number;
    matiere: string | number;
    classe: string | number;
  }>({
    type: 'CC',
    date: new Date().toISOString().split('T')[0],
    heure_debut: '',
    heure_fin: '',
    note_max: 20,
    matiere: '',
    classe: '',
  });
  const [gradesData, setGradesData] = useState<Record<number, { valeur_note: string; commentaire: string; est_absent: boolean }>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user and teacher profile
        const userRes = await api.get('/accounts/auth/me/');
        const user = userRes.data;

        if (user.role !== 'enseignant') {
          toast.error('Accès non autorisé');
          return;
        }

        const teacherRes = await api.get(`/accounts/enseignants/?utilisateur=${user.id}`);
        const teacherData = teacherRes.data.results || teacherRes.data;
        const teacher = Array.isArray(teacherData) ? teacherData[0] : teacherData;

        if (!teacher) {
          toast.error('Profil enseignant non trouvé');
          return;
        }

        const teacherId = teacher.id;
        setTeacherId(teacherId);

        // Get teacher's assignments
        const assignRes = await api.get(`/academics/enseignant-matieres/?enseignant=${teacherId}`);
        const assigns = assignRes.data.results || assignRes.data;
        setAssignments(assigns);

        // Get unique classes and matieres
        const classIds = [...new Set(assigns.map((a: Assignment) => a.classe))];
        const matiereIds = [...new Set(assigns.map((a: Assignment) => a.matiere))];

        const [classRes, matRes, evalRes] = await Promise.all([
          Promise.all(classIds.map(id => api.get(`/academics/classes/${id}/`))),
          Promise.all(matiereIds.map(id => api.get(`/academics/matieres/${id}/`))),
          api.get('/grades/evaluations/'),
        ]);

        setClasses(classRes.map(r => r.data));
        setMatieres(matRes.map(r => r.data));
        setEvaluations(evalRes.data.results || evalRes.data);

      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const loadStudentsForClass = async (classId: number) => {
    if (students[classId]) return;
    try {
      const res = await api.get(`/accounts/etudiants/?classe=${classId}`);
      setStudents(prev => ({ ...prev, [classId]: res.data.results || res.data }));
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants');
    }
  };

  const createEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...evaluationForm,
        matiere: parseInt(evaluationForm.matiere as string),
        classe: parseInt(evaluationForm.classe as string),
        enseignant: teacherId
      };
      const response = await api.post('/grades/evaluations/', payload);
      setEvaluations(prev => [...prev, response.data]);
      toast.success('Évaluation créée avec succès');
      setIsCreateEvalModalOpen(false);
      setEvaluationForm({
        type: 'CC',
        date: new Date().toISOString().split('T')[0],
        heure_debut: '',
        heure_fin: '',
        note_max: 20,
        matiere: '',
        classe: '',
      });
    } catch (error: any) {
      let errorMsg = 'Erreur lors de la création de l\'évaluation';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.non_field_errors) {
          errorMsg = data.non_field_errors[0];
        } else if (data.detail) {
           errorMsg = data.detail;
         } else {
           const keys = Object.keys(data);
           if (keys.length > 0) {
             const firstKey = keys[0];
             const firstError = data[firstKey];
             if (Array.isArray(firstError)) {
               errorMsg = `${firstKey}: ${firstError[0]}`;
             } else if (typeof firstError === 'string') {
               errorMsg = firstError;
             }
           }
         }
       }
       toast.error(errorMsg);
     }
   };

  const openGradeModal = async (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    await loadStudentsForClass(evaluation.classe);
    setIsGradeModalOpen(true);

    // Load existing grades
    try {
      const notesRes = await api.get(`/grades/notes/?evaluation=${evaluation.id}`);
      const existingNotes = notesRes.data.results || notesRes.data;
      const gradesMap: Record<number, { valeur_note: string; commentaire: string; est_absent: boolean }> = {};

      existingNotes.forEach((note: Note) => {
        gradesMap[note.etudiant] = {
          valeur_note: note.valeur_note?.toString() || '',
          commentaire: note.commentaire,
          est_absent: note.est_absent,
        };
      });

      setGradesData(gradesMap);
    } catch (error) {
      console.error('Error loading existing grades:', error);
    }
  };

  const submitGrades = async () => {
    if (!selectedEvaluation) return;

    try {
      const promises = Object.entries(gradesData).map(async ([studentId, gradeData]) => {
        const noteData = {
          evaluation: selectedEvaluation.id,
          etudiant: parseInt(studentId),
          valeur_note: gradeData.est_absent ? null : (gradeData.valeur_note ? parseFloat(gradeData.valeur_note) : null),
          commentaire: gradeData.commentaire,
          est_absent: gradeData.est_absent,
        };

        // Check if note already exists
        try {
          const existingRes = await api.get(`/grades/notes/?evaluation=${selectedEvaluation.id}&etudiant=${studentId}`);
          const existingNotes = existingRes.data.results || existingRes.data;
          if (existingNotes.length > 0) {
            // Update existing note
            return api.put(`/grades/notes/${existingNotes[0].id}/`, noteData);
          }
        } catch (error) {
          // Note doesn't exist, create new one
        }

        // Create new note
        return api.post('/grades/notes/', noteData);
      });

      await Promise.all(promises);
      toast.success('Notes enregistrées avec succès');

      // Refresh evaluations to update any changes
      const evalRes = await api.get('/grades/evaluations/');
      setEvaluations(evalRes.data.results || evalRes.data);

      setIsGradeModalOpen(false);
      setSelectedEvaluation(null);
      setGradesData({});

    } catch (error: any) {
      let errorMsg = 'Erreur lors de l\'enregistrement des notes';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.non_field_errors) {
          errorMsg = data.non_field_errors[0];
        } else if (data.detail) {
           errorMsg = data.detail;
         } else {
           const keys = Object.keys(data);
           if (keys.length > 0) {
             const firstKey = keys[0];
             const firstError = data[firstKey];
             if (Array.isArray(firstError)) {
               errorMsg = `${firstKey}: ${firstError[0]}`;
             }
           }
         }
       }
       toast.error(errorMsg);
     }
   };

  const deleteEvaluation = async () => {
    if (!evalToDelete) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/grades/evaluations/${evalToDelete}/`);
      setEvaluations(prev => prev.filter(e => e.id !== evalToDelete));
      toast.success('Évaluation supprimée définitivement');
      setIsDeleteModalOpen(false);
      setEvalToDelete(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter(e => {
    const matchClass = !classFilter || e.classe === parseInt(classFilter);
    const matiereName = matieres.find(m => m.id === e.matiere)?.nom || '';
    const matchSearch = !searchFilter || 
      matiereName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.type.toLowerCase().includes(searchFilter.toLowerCase());
    return matchClass && matchSearch;
  });

  const getMatieresForTeacher = () => {
    return matieres;
  };

  const getClassesForSelectedMatiere = () => {
    if (!evaluationForm.matiere) return [];
    const matiereId = parseInt(evaluationForm.matiere as string);
    const relevantAssignments = assignments.filter(a => a.matiere === matiereId);
    const classIds = relevantAssignments.map(a => a.classe);
    return classes.filter(c => classIds.includes(c.id));
  };

  const currentClassStudents = selectedEvaluation ? students[selectedEvaluation.classe] || [] : [];

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestion des Notes</h1>
          <p className="text-slate-500 mt-1">Créez des évaluations et saisissez les notes.</p>
        </div>
        <button
          onClick={() => setIsCreateEvalModalOpen(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Évaluation
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Évaluations
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une évaluation..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom} - {c.niveau}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Évaluation</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Matière</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Classe</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvaluations.length > 0 ? filteredEvaluations.map((evalItem) => (
                <tr key={evalItem.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">
                        Évaluation de {evalItem.matiere_name || matieres.find(m => m.id === evalItem.matiere)?.nom || `Matière #${evalItem.matiere}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-600 font-medium">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{evalItem.type}</span>
                  </td>
                  <td className="px-8 py-6 text-slate-500">
                    {matieres.find(m => m.id === evalItem.matiere)?.nom || `Matière ${evalItem.matiere}`}
                  </td>
                  <td className="px-8 py-6 text-slate-500">
                    {classes.find(c => c.id === evalItem.classe)?.nom || `Classe ${evalItem.classe}`}
                  </td>
                  <td className="px-8 py-6 text-slate-500">{evalItem.date || 'Non planifiée'}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openGradeModal(evalItem)}
                        className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Saisir Notes
                      </button>
                      <button
                        onClick={() => {
                          setEvalToDelete(evalItem.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic">
                    Aucune évaluation trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Evaluation Modal */}
      <Modal isOpen={isCreateEvalModalOpen} onClose={() => setIsCreateEvalModalOpen(false)} title="Créer une évaluation">
        <form onSubmit={createEvaluation} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type d'évaluation</label>
              <select
                value={evaluationForm.type}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                <option value="CC">Contrôle Continu</option>
                <option value="Examen">Examen Final</option>
                <option value="TP">Travaux Pratiques</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={evaluationForm.date}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Heure de début</label>
              <input
                type="time"
                value={evaluationForm.heure_debut}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, heure_debut: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Heure de fin</label>
              <input
                type="time"
                value={evaluationForm.heure_fin}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, heure_fin: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Matière</label>
              <select
                value={evaluationForm.matiere}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, matiere: parseInt(e.target.value) || '', classe: '' }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              >
                <option value="">Sélectionner une matière</option>
                {getMatieresForTeacher().map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Classe</label>
              <select
                value={evaluationForm.classe}
                onChange={(e) => setEvaluationForm(prev => ({ ...prev, classe: parseInt(e.target.value) || '' }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                required
                disabled={!evaluationForm.matiere}
              >
                <option value="">Sélectionner une classe</option>
                {getClassesForSelectedMatiere().map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} - {classe.niveau}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Note maximale</label>
            <input
              type="number"
              min="1"
              max="100"
              value={evaluationForm.note_max}
              onChange={(e) => setEvaluationForm(prev => ({ ...prev, note_max: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsCreateEvalModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Créer l'évaluation
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade Entry Modal */}
      <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title={`Saisie des notes - Évaluation de ${selectedEvaluation?.matiere_name || matieres.find(m => m.id === selectedEvaluation?.matiere)?.nom || ''}`}>
        <div className="space-y-6">
          <div className="max-h-96 overflow-y-auto">
            <h4 className="font-bold text-slate-900 mb-4">Notes des étudiants</h4>
            <div className="space-y-4">
              {currentClassStudents.map((student) => (
                <div key={student.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-slate-900">{student.first_name} {student.last_name}</h5>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`absent-${student.id}`}
                        checked={gradesData[student.id]?.est_absent || false}
                        onChange={(e) => setGradesData(prev => ({
                          ...prev,
                          [student.id]: {
                            ...prev[student.id],
                            est_absent: e.target.checked,
                            valeur_note: e.target.checked ? '' : prev[student.id]?.valeur_note || ''
                          }
                        }))}
                        className="rounded border-slate-300"
                      />
                      <label htmlFor={`absent-${student.id}`} className="text-sm text-slate-700">Absent</label>
                    </div>
                  </div>

                  {!gradesData[student.id]?.est_absent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note (/20)</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          value={gradesData[student.id]?.valeur_note || ''}
                          onChange={(e) => setGradesData(prev => ({
                            ...prev,
                            [student.id]: {
                              ...prev[student.id],
                              valeur_note: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
                        <input
                          type="text"
                          value={gradesData[student.id]?.commentaire || ''}
                          onChange={(e) => setGradesData(prev => ({
                            ...prev,
                            [student.id]: {
                              ...prev[student.id],
                              commentaire: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="Commentaire optionnel"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsGradeModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submitGrades}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Enregistrer les notes
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Supprimer définitivement"
        maxWidth="sm"
      >
        <div className="space-y-6">
          <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl flex items-start gap-3 border border-rose-100">
            <Trash2 className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action supprimera également toutes les notes saisies.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
            >
              Annuler
            </button>
            <button
              onClick={deleteEvaluation}
              disabled={isActionLoading}
              className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center gap-2"
            >
              {isActionLoading && <Spinner className="w-4 h-4" />}
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}