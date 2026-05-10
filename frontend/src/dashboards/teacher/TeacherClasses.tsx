import { useEffect, useState } from 'react';
import { GraduationCap, Users, ChevronRight, Search, Clock, FileSpreadsheet } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

interface Assignment {
  id: number;
  matiere: number;
  classe: number;
  matiere_name?: string;
  classe_name?: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  nb_etudiants?: number;
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
  nom_complet?: string;
}

export default function TeacherClasses() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [students, setStudents] = useState<Record<number, Student[]>>({});
  const [loading, setLoading] = useState(true);
  // const [teacherId, setTeacherId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<{ notes: any[], absences: any[] } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Profile Filters
  const [profileSearch, setProfileSearch] = useState('');
  const [profileDate, setProfileDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {

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
        // setTeacherId(teacher.id);
        const currentTeacherId = teacher.id;

        const [assignRes] = await Promise.all([
          api.get(`/academics/enseignant-matieres/?enseignant=${currentTeacherId}`),
        ]);

        const assigns = assignRes.data.results || assignRes.data;
        setAssignments(assigns);

        const classIds = [...new Set(assigns.map((a: Assignment) => a.classe))];
        const classPromises = classIds.map(id => api.get(`/academics/classes/${id}/`));
        const classRes = await Promise.all(classPromises);
        setClasses(classRes.map(r => r.data));

      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const loadStudents = async (classId: number) => {
    if (students[classId]) return;
    try {
      const res = await api.get(`/accounts/etudiants/?classe=${classId}`);
      setStudents(prev => ({ ...prev, [classId]: res.data.results || res.data }));
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants');
    }
  };

  const toggleClass = (classId: number) => {
    if (expandedId === classId) {
      setExpandedId(null);
    } else {
      setExpandedId(classId);
      loadStudents(classId);
    }
  };

  const openStudentProfile = async (student: Student) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
    setLoadingProfile(true);
    try {
      const [notesRes, absRes] = await Promise.all([
        api.get(`/grades/notes/?etudiant=${student.id}`),
        api.get(`/academics/absences/?etudiant=${student.id}`),
      ]);

      const myNotes = notesRes.data.results || notesRes.data;
      const myAbs = absRes.data.results || absRes.data;

      setStudentDetails({ notes: myNotes, absences: myAbs });
    } catch (error) {
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const getAssignmentsForClass = (classId: number) => {
    return assignments.filter(a => a.classe === classId);
  };

  const filteredClasses = classes.filter(c =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.niveau.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mes Classes</h1>
          <p className="text-slate-500 mt-1">Classes et étudiants que vous enseignez.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Aucune classe trouvée.</div>
          ) : (
            filteredClasses.map(cls => {
              const classAssignments = getAssignmentsForClass(cls.id);
              const classStudents = students[cls.id] || [];
              const isExpanded = expandedId === cls.id;

              return (
                <div key={cls.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => toggleClass(cls.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{cls.nom}</h3>
                        <p className="text-slate-500">{cls.niveau}</p>
                        <p className="text-sm text-slate-400">
                          {classAssignments.length} matière(s) • {cls.nb_etudiants ?? classStudents.length} étudiant(s)
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="p-6 border-t border-slate-200">
                      <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Étudiants ({classStudents.length})
                      </h4>

                      {classStudents.length === 0 ? (
                        <p className="text-slate-400 italic">Aucun étudiant dans cette classe.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {classStudents.map(student => (
                            <div key={student.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-sm text-slate-500">{student.email}</p>
                                <p className="text-xs text-slate-400">Code: {student.code_apogee}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openStudentProfile(student)}
                                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2 font-semibold text-sm"
                                  title="Voir le profil"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                  Détails
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileSearch('');
          setProfileDate('');
        }}
        title={`Profil Étudiant : ${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
        maxWidth="2xl"
      >
        {loadingProfile ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="space-y-8 py-4">
            {/* Profile Header with Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-0 z-10">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher par matière ou évaluation..." 
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="relative w-full md:w-auto">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={profileDate}
                  onChange={(e) => setProfileDate(e.target.value)}
                  className="w-full md:w-48 pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Notes Section */}
            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                Notes dans vos matières
              </h4>
              <div className="space-y-3">
                {studentDetails?.notes.filter(n => {
                  const s = profileSearch.toLowerCase();
                  const matchesText = n.evaluation_details?.matiere_name?.toLowerCase().includes(s) || 
                                    n.evaluation_details?.type_display?.toLowerCase().includes(s);
                  const matchesDate = !profileDate || n.evaluation_details?.date === profileDate;
                  return matchesText && matchesDate;
                }).length === 0 ? (
                  <p className="text-slate-400 italic text-center py-4 bg-white rounded-xl border border-dashed">Aucune note trouvée avec ces filtres.</p>
                ) : (
                  studentDetails?.notes
                    .filter(n => {
                      const s = profileSearch.toLowerCase();
                      const matchesText = n.evaluation_details?.matiere_name?.toLowerCase().includes(s) || 
                                        n.evaluation_details?.type_display?.toLowerCase().includes(s);
                      const matchesDate = !profileDate || n.evaluation_details?.date === profileDate;
                      return matchesText && matchesDate;
                    })
                    .map(note => (
                    <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">{note.evaluation_details?.matiere_name}</p>
                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest">
                          {note.evaluation_details?.type_display} • {note.evaluation_details?.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${note.est_absent ? 'text-rose-500' : 'text-primary'}`}>
                          {note.est_absent ? 'ABS' : `${note.valeur_note}/20`}
                        </p>
                        {note.commentaire && <p className="text-[10px] text-slate-400 italic max-w-50 truncate">"{note.commentaire}"</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Absences Section */}
            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                Absences dans vos séances
              </h4>
              <div className="space-y-3">
                {studentDetails?.absences.filter(a => {
                  const s = profileSearch.toLowerCase();
                  const matchesText = a.enseignant_matiere_details?.matiere_name?.toLowerCase().includes(s);
                  const matchesDate = !profileDate || a.date === profileDate;
                  return matchesText && matchesDate;
                }).length === 0 ? (
                  <p className="text-slate-400 italic text-center py-4 bg-white rounded-xl border border-dashed">Aucune absence trouvée avec ces filtres.</p>
                ) : (
                  studentDetails?.absences
                    .filter(a => {
                      const s = profileSearch.toLowerCase();
                      const matchesText = a.enseignant_matiere_details?.matiere_name?.toLowerCase().includes(s);
                      const matchesDate = !profileDate || a.date === profileDate;
                      return matchesText && matchesDate;
                    })
                    .map(abs => (
                    <div key={abs.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-rose-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100">
                          <span className="text-[8px] font-black uppercase text-slate-400 leading-none">Jour</span>
                          <span className="text-xs font-black text-slate-900">{abs.date.split('-')[2]}/{abs.date.split('-')[1]}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{abs.enseignant_matiere_details?.matiere_name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {abs.seance_details ? `${abs.seance_details.heure_debut} - ${abs.seance_details.heure_fin}` : `${abs.duree_heures}h`}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${abs.justifiee ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {abs.justifiee ? 'Justifiée' : 'Non Justifiée'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}