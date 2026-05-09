import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, BookOpen, User, School, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import TimetableGrid from '../../components/TimetableGrid';

export default function TimetableManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | string>('');
  const [seances, setSeances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [editingSeance, setEditingSeance] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; isEvaluation: boolean } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<number | undefined>(undefined);
  const [formType, setFormType] = useState<'seance' | 'evaluation'>('seance');

  const [formData, setFormData] = useState({
    enseignant_matiere: '',
    salle: '',
    jour: 'lundi',
    heure_debut: '',
    heure_fin: '',
    date: new Date().toISOString().split('T')[0],
    type: 'CC',
    note_max: '20',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, matieresRes, assignmentsRes, sallesRes, userRes] = await Promise.all([
        api.get('/academics/classes/'),
        api.get('/academics/matieres/'),
        api.get('/academics/enseignant-matieres/'),
        api.get('/academics/salles/'),
        api.get('/accounts/auth/me/'),
      ]);
      setClasses(classesRes.data.results || classesRes.data);
      setMatieres(matieresRes.data.results || matieresRes.data);
      setAssignments(assignmentsRes.data.results || assignmentsRes.data);
      setSalles(sallesRes.data.results || sallesRes.data);
      
      const user = userRes.data;
      if (user.role === 'enseignant') {
        try {
          const teacherRes = await api.get(`/accounts/enseignants/?utilisateur=${user.id}`);
          const teacher = teacherRes.data.results?.[0] || teacherRes.data[0];
          if (teacher) setCurrentTeacherId(teacher.id);
        } catch (e) {
          console.error("Could not fetch teacher profile", e);
        }
      }

      if (classesRes.data.results?.length > 0 || classesRes.data.length > 0) {
        const firstClass = classesRes.data.results?.[0] || classesRes.data[0];
        setSelectedClassId(firstClass.id);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeances = async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.get(`/academics/seances/?classe=${selectedClassId}`);
      setSeances(res.data.results || res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des séances');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSeances();
  }, [selectedClassId]);

  const handleDeleteSeance = (id: number) => {
    setItemToDelete({ id, isEvaluation: false });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsActionLoading(true);
    try {
      if (itemToDelete.isEvaluation) {
        // Instead of deleting the evaluation, we just "unschedule" it
        // by clearing the hours, so it stays available for the teacher.
        await api.patch(`/grades/evaluations/${itemToDelete.id}/`, {
          heure_debut: null,
          heure_fin: null,
          salle: null
        });
        toast.success('Évaluation retirée de l\'emploi du temps');
      } else {
        await api.delete(`/academics/seances/${itemToDelete.id}/`);
        toast.success('Séance supprimée');
      }
      
      setIsDeleteModalOpen(false);
      // Refresh the timetable grid
      const current = selectedClassId;
      setSelectedClassId('');
      setTimeout(() => setSelectedClassId(current), 10);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsActionLoading(false);
      setItemToDelete(null);
    }
  };

  const handleEditSeance = async (item: any) => {
    try {
      if (item.type === 'evaluation') {
        setFormType('evaluation');
        // Need full details of evaluation
        const res = await api.get(`/grades/evaluations/${item.id}/`);
        const fullEval = res.data;
        setEditingSeance(fullEval);
        setFormData({
          enseignant_matiere: assignments.find(a => a.enseignant === fullEval.enseignant && a.matiere === fullEval.matiere && a.classe === fullEval.classe)?.id.toString() || '',
          salle: fullEval.salle?.toString() || '',
          jour: 'lundi',
          heure_debut: fullEval.heure_debut.substring(0, 5),
          heure_fin: fullEval.heure_fin.substring(0, 5),
          date: fullEval.date,
          type: fullEval.type,
          note_max: fullEval.note_max.toString(),
        });
      } else {
        const res = await api.get(`/academics/seances/${item.id}/`);
        const fullSeance = res.data;
        setFormType('seance');
        setEditingSeance(fullSeance);
        setFormData({
          enseignant_matiere: fullSeance.enseignant_matiere.toString(),
          salle: fullSeance.salle?.toString() || '',
          jour: fullSeance.jour,
          heure_debut: fullSeance.heure_debut.substring(0, 5),
          heure_fin: fullSeance.heure_fin.substring(0, 5),
          date: new Date().toISOString().split('T')[0],
          type: 'CC',
          note_max: '20',
        });
      }
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);

    // Find the assignment to get the matiere_id
    const assignmentId = parseInt(formData.enseignant_matiere);
    const assignment = assignments.find(a => a.id === assignmentId);

    if (!assignment) {
      toast.error('Affectation invalide');
      setIsActionLoading(false);
      return;
    }

    try {
      if (formType === 'seance') {
        const payload = {
          enseignant_matiere: assignmentId,
          salle: formData.salle || null,
          classe: selectedClassId,
          matiere: assignment.matiere,
          jour: formData.jour,
          heure_debut: formData.heure_debut,
          heure_fin: formData.heure_fin,
        };

        if (editingSeance && editingSeance.jour) { // Real seance (has 'jour' field)
          await api.patch(`/academics/seances/${editingSeance.id}/`, payload);
          toast.success('Séance modifiée avec succès');
        } else {
          await api.post('/academics/seances/', payload);
          toast.success('Séance ajoutée avec succès');
        }
      } else {
        // Evaluation
        const payload = {
          matiere: assignment.matiere,
          classe: selectedClassId,
          enseignant: assignment.enseignant,
          salle: formData.salle || null,
          date: formData.date,
          heure_debut: formData.heure_debut,
          heure_fin: formData.heure_fin,
          type: formData.type,
          note_max: parseFloat(formData.note_max),
        };
        
        if (editingSeance) {
          if (editingSeance.date) {
            // Updating existing evaluation
            await api.patch(`/grades/evaluations/${editingSeance.id}/`, payload);
            toast.success('Évaluation modifiée avec succès');
          } else if (editingSeance.jour) {
            // Converting Séance to Evaluation
            // First create evaluation
            await api.post('/grades/evaluations/', payload);
            // Then delete the original seance
            await api.delete(`/academics/seances/${editingSeance.id}/`);
            toast.success('Séance transformée en évaluation');
          }
        } else {
          await api.post('/grades/evaluations/', payload);
          toast.success('Évaluation programmée avec succès');
        }
      }

      setIsModalOpen(false);
      setEditingSeance(null);
      // Reset form but keep some defaults
      setFormData({
        ...formData,
        enseignant_matiere: '',
        salle: '',
        heure_debut: '',
        heure_fin: '',
      });
      // Refresh the timetable grid
      const current = selectedClassId;
      setSelectedClassId('');
      setTimeout(() => setSelectedClassId(current), 10);
    } catch (error: any) {
      let errorMsg = 'Erreur lors de l\'enregistrement';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.non_field_errors) {
          errorMsg = data.non_field_errors[0];
        } else if (data.detail) {
          errorMsg = data.detail;
        } else {
           // Extract first error from field errors
           const keys = Object.keys(data);
           if (keys.length > 0) {
             const firstKey = keys[0];
             const firstError = data[firstKey];
             if (Array.isArray(firstError)) {
               errorMsg = `${firstKey}: ${firstError[0]}`;
             } else if (typeof firstError === 'string') {
               errorMsg = `${firstKey}: ${firstError}`;
             }
           }
         }
       }
       toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSeance(null);
    setFormType('seance'); // Par défaut on propose un cours normal
    setFormData({
      enseignant_matiere: '',
      salle: '',
      jour: 'lundi',
      heure_debut: '',
      heure_fin: '',
      date: new Date().toISOString().split('T')[0],
      type: 'CC',
      note_max: '20',
    });
    setIsModalOpen(true);
  };

  const filteredAssignments = assignments.filter(a => a.classe === parseInt(selectedClassId as string));

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Emploi du temps</h1>
          <p className="text-slate-500 mt-1">Gérez la planification des cours par classe.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={!selectedClassId}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Ajouter une séance
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-end gap-6 mb-8">
          <div className="space-y-2 flex-1 max-w-xs">
            <label className="text-sm font-bold text-slate-700 ml-1">Sélectionner une classe</label>
            <div className="relative">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200 appearance-none font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedClassId ? (
          <div className="space-y-12">
            <TimetableGrid 
              classeId={selectedClassId} 
              isAdmin={true} 
              currentTeacherId={currentTeacherId}
              onDelete={(id, isEvaluation) => {
                setItemToDelete({ id, isEvaluation: isEvaluation || false });
                setIsDeleteModalOpen(true);
              }}
              onEdit={handleEditSeance}
            />
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            Veuillez sélectionner une classe pour voir son emploi du temps.
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingSeance(null);
        }} 
        title={editingSeance ? "Modifier la séance" : "Programmer un cours ou évaluation"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {!editingSeance && (
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormType('seance')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${formType === 'seance' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Cours normal
              </button>
              <button
                type="button"
                onClick={() => setFormType('evaluation')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${formType === 'evaluation' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Évaluation / Examen
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Cours et Prof</label>
              <select 
                name="enseignant_matiere" 
                value={formData.enseignant_matiere}
                onChange={(e) => setFormData({ ...formData, enseignant_matiere: e.target.value })}
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
              >
                <option value="">Sélectionner un cours</option>
                {filteredAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.matiere_name} - {a.enseignant_name}
                  </option>
                ))}
              </select>
            </div>

            {formType === 'seance' ? (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Jour de la semaine</label>
                <select 
                  name="jour" 
                  value={formData.jour}
                  onChange={(e) => setFormData({ ...formData, jour: e.target.value })}
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
                >
                  <option value="lundi">Lundi</option>
                  <option value="mardi">Mardi</option>
                  <option value="mercredi">Mercredi</option>
                  <option value="jeudi">Jeudi</option>
                  <option value="vendredi">Vendredi</option>
                  <option value="samedi">Samedi</option>
                  <option value="dimanche">Dimanche</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Date de l'évaluation</label>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all duration-200" 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Heure de début</label>
              <input 
                type="time" 
                name="heure_debut" 
                value={formData.heure_debut}
                onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Heure de fin</label>
              <input 
                type="time" 
                name="heure_fin" 
                value={formData.heure_fin}
                onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Salle</label>
              <select 
                name="salle" 
                value={formData.salle}
                onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
              >
                <option value="">Sélectionner une salle (optionnel)</option>
                {salles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom} {s.capacite ? `(${s.capacite} places)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {formType === 'evaluation' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Type d'évaluation</label>
                  <select 
                    name="type" 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all duration-200"
                  >
                    <option value="CC">Contrôle Continu</option>
                    <option value="Examen">Examen Final</option>
                    <option value="TP">Travaux Pratiques</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Note Max</label>
                  <input 
                    type="number" 
                    name="note_max" 
                    value={formData.note_max}
                    onChange={(e) => setFormData({ ...formData, note_max: e.target.value })}
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all duration-200" 
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => {
                setIsModalOpen(false);
                setEditingSeance(null);
              }} 
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isActionLoading || (filteredAssignments.length === 0 && !editingSeance)}
              className={`px-8 py-3 ${formType === 'evaluation' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'} text-white font-bold rounded-2xl transition-all duration-200 shadow-lg flex items-center gap-2 disabled:opacity-50`}
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingSeance ? "Enregistrer" : formType === 'evaluation' ? "Programmer l'évaluation" : "Programmer le cours"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        title="Confirmer la suppression"
        maxWidth="sm"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">
              {itemToDelete?.isEvaluation 
                ? "Voulez-vous retirer cette évaluation de l'emploi du temps ? Elle restera accessible pour la saisie des notes."
                : "Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible."}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
              }}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteItem}
              disabled={isActionLoading}
              className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {itemToDelete?.isEvaluation ? 'Retirer' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
