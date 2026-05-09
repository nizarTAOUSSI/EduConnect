import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, GraduationCap, Users, User, Mail, Phone, BookOpen, UserCheck } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function ClassesManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<any | null>(null);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Student list modal state
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedClassStudents, setSelectedClassStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Assignments modal state (Teachers & Subjects)
  const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false);
  const [selectedClassAssignments, setSelectedClassAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');

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

  const fetchClassStudents = async (classe: any) => {
    try {
      setCurrentClass(classe);
      setStudentsLoading(true);
      setIsStudentsModalOpen(true);
      setStudentSearchTerm('');
      const res = await api.get(`/accounts/etudiants/?classe=${classe.id}`);
      setSelectedClassStudents(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchClassAssignments = async (classe: any) => {
    try {
      setCurrentClass(classe);
      setAssignmentsLoading(true);
      setIsAssignmentsModalOpen(true);
      setAssignmentSearchTerm('');
      const res = await api.get(`/academics/enseignant-matieres/?classe=${classe.id}`);
      setSelectedClassAssignments(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des affectations');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDeleteClick = (id: number) => {
    setClassToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/academics/classes/${classToDelete}/`);
      toast.success('Classe supprimée avec succès');
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
      fetchClasses();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
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
      if (currentClass?.id) {
        await api.patch(`/academics/classes/${currentClass.id}/`, data);
        toast.success('Classe mise à jour');
      } else {
        await api.post('/academics/classes/', data);
        toast.success('Classe créée avec succès');
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredClasses = classes.filter((c) =>
    (c.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Classes</h1>
          <p className="text-slate-500 mt-1">Gérez les classes et leurs niveaux.</p>
        </div>
        <button
          onClick={() => {
            setCurrentClass(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ajouter une classe
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une classe..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-emerald-600" /></div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <Table columns={['Classe', 'Niveau', 'Étudiants', 'Affectations', 'Actions']} isEmpty={filteredClasses.length === 0}>
              {filteredClasses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-900">{c.nom}</div>
                    </div>
                  </Td>
                  <Td><span className="font-medium text-slate-600">{c.niveau}</span></Td>
                  <Td>
                    <button
                      onClick={() => fetchClassStudents(c)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 group/btn"
                    >
                      <Users className="w-4 h-4 text-slate-400 group-hover/btn:text-emerald-500" />
                      <span className="font-bold text-sm">{c.nb_etudiants || 0}</span>
                    </button>
                  </Td>
                  <Td>
                    <button
                      onClick={() => fetchClassAssignments(c)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group/btn-assign"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400 group-hover/btn-assign:text-blue-500" />
                      <span className="font-bold text-sm">Voir</span>
                    </button>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button 
                        onClick={() => { setCurrentClass(c); setIsModalOpen(true); }} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(c.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentClass?.id ? 'Modifier la classe' : 'Créer une classe'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Nom de la classe</label>
            <input 
              name="nom" 
              defaultValue={currentClass?.nom} 
              required 
              placeholder="Ex: 2ème Année"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Niveau</label>
            <select 
              name="niveau" 
              defaultValue={currentClass?.niveau || '1ere annee'} 
              required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
            >
              <option value="1ere annee">1ère Année</option>
              <option value="2eme annee">2ème Année</option>
              <option value="3eme annee">3ème Année</option>
              <option value="4eme annee">4ème Année</option>
              <option value="5eme annee">5ème Année</option>
            </select>
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isActionLoading}
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Sauvegarder
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la classe"
        message={`Êtes-vous sûr de vouloir supprimer la classe "${classes.find(c => c.id === classToDelete)?.nom}" ? Cette action supprimera également les données associées.`}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isActionLoading}
      />

      {/* Student List Modal */}
      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        title={`Étudiants - ${currentClass?.nom}`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer les étudiants..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
            />
          </div>

          {studentsLoading ? (
            <div className="flex justify-center py-12"><Spinner className="text-emerald-600" /></div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedClassStudents.filter(s => 
                `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(studentSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  Aucun étudiant trouvé.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClassStudents.filter(s => 
                    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(studentSearchTerm.toLowerCase())
                  ).map((student) => (
                    <div key={student.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 group hover:border-emerald-200 hover:bg-white transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Étudiant</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setIsStudentsModalOpen(false)}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>

      {/* Assignments Modal (Teachers & Subjects) */}
      <Modal
        isOpen={isAssignmentsModalOpen}
        onClose={() => setIsAssignmentsModalOpen(false)}
        title={`Affectations - ${currentClass?.nom}`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer par matière ou enseignant..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              value={assignmentSearchTerm}
              onChange={(e) => setAssignmentSearchTerm(e.target.value)}
            />
          </div>

          {assignmentsLoading ? (
            <div className="flex justify-center py-12"><Spinner className="text-blue-600" /></div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedClassAssignments.filter(a => 
                `${a.matiere_name} ${a.enseignant_name}`.toLowerCase().includes(assignmentSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  Aucune affectation trouvée pour cette classe.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClassAssignments.filter(a => 
                    `${a.matiere_name} ${a.enseignant_name}`.toLowerCase().includes(assignmentSearchTerm.toLowerCase())
                  ).map((assignment) => (
                    <div key={assignment.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 group hover:border-blue-200 hover:bg-white transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {assignment.matiere_name}
                          </p>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Matière</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                          <UserCheck className="w-4 h-4 text-slate-400" />
                          <span>{assignment.enseignant_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setIsAssignmentsModalOpen(false)}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
