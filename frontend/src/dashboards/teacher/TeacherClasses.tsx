import { useEffect, useState } from 'react';
import { Users, Search, GraduationCap, BookOpen, ChevronRight, ArrowLeft, FileText, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  utilisateur: number;
  first_name: string;
  last_name: string;
  email: string;
  code_apogee: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  matieres: { id: number; nom: string }[];
  student_count: number;
}

export default function TeacherClasses() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<Classe | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [studentFilter, setStudentFilter] = useState('');

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/academics/enseignant-classes/');
        setClasses(res.data.results || res.data);
      } catch (error) {
        toast.error(t('teacher_absences.messages.load_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchMyClasses();
  }, [t]);

  const handleClassClick = async (classe: Classe) => {
    setSelectedClass(classe);
    setLoadingStudents(true);
    try {
      const res = await api.get(`/accounts/etudiants/?classe=${classe.id}`);
      setStudents(res.data.results || res.data);
    } catch (error) {
      toast.error(t('teacher_absences.messages.load_students_error'));
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentClick = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingDetails(true);
    try {
      const [notesRes, absRes] = await Promise.all([
        api.get(`/grades/notes/?etudiant=${student.id}&only_my_subjects=true`),
        api.get(`/academics/absences/?etudiant=${student.id}&only_my_subjects=true`)
      ]);
      setStudentDetails({
        notes: notesRes.data.results || notesRes.data,
        absences: absRes.data.results || absRes.data
      });
    } catch (error) {
      toast.error(t('teacher_classes.student_profile.load_error'));
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.niveau.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentFilter.toLowerCase()) ||
    s.code_apogee.toLowerCase().includes(studentFilter.toLowerCase())
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  if (selectedStudent) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <button 
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl">
              {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{selectedStudent.code_apogee}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notes */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                {t('teacher_classes.student_profile.notes_title')}
              </h3>
              <div className="space-y-4">
                {loadingDetails ? <Spinner /> : studentDetails?.notes.length > 0 ? studentDetails.notes.map((note: any) => (
                  <div key={note.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-900">{note.evaluation_details.matiere_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{note.evaluation_details.type_display} • {note.evaluation_details.date}</p>
                      </div>
                      <span className={`text-lg font-black ${note.valeur_note < 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {note.valeur_note}/20
                      </span>
                    </div>
                    {note.commentaire && <p className="text-sm text-slate-500 italic">"{note.commentaire}"</p>}
                  </div>
                )) : <p className="text-slate-400 italic text-sm">{t('teacher_classes.student_profile.no_notes')}</p>}
              </div>
            </div>

            {/* Absences */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                {t('teacher_classes.student_profile.absences_title')}
              </h3>
              <div className="space-y-4">
                {loadingDetails ? <Spinner /> : studentDetails?.absences.length > 0 ? studentDetails.absences.map((abs: any) => (
                  <div key={abs.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex flex-col items-center justify-center border border-slate-100 shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{t('student_absences.table.date')}</span>
                        <span className="text-xs font-black text-slate-900">{abs.date.split('-')[2]}/{abs.date.split('-')[1]}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{abs.enseignant_matiere_details.matiere_name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                          <Clock className="w-3 h-3" />
                          {abs.seance_details.heure_debut} - {abs.seance_details.heure_fin}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${abs.justifiee ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {abs.justifiee ? t('student_absences.table.justified') : t('student_absences.table.unjustified')}
                    </span>
                  </div>
                )) : <p className="text-slate-400 italic text-sm">{t('teacher_classes.student_profile.no_absences')}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <button 
          onClick={() => setSelectedClass(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedClass.nom}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-1">{selectedClass.niveau}</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('teacher_classes.search_placeholder')}
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{t('teacher_classes.students_list', { count: students.length })}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {loadingStudents ? <div className="p-12 text-center"><Spinner /></div> : filteredStudents.length > 0 ? filteredStudents.map((student) => (
              <div key={student.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none mb-1">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student.code_apogee}</span>
                  <button 
                    onClick={() => handleStudentClick(student)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-primary hover:shadow-md transition-all"
                    title={t('teacher_classes.view_profile')}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic">
                {t('teacher_classes.no_students')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('teacher_classes.title')}</h1>
          <p className="text-slate-500 mt-1">{t('teacher_classes.subtitle')}</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('teacher_classes.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClasses.length > 0 ? filteredClasses.map((classe) => (
          <div 
            key={classe.id} 
            className="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer"
            onClick={() => handleClassClick(classe)}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-7 h-7" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{classe.nom}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">{classe.niveau}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-600">{t('teacher_classes.subjects_count', { count: classe.matieres.length })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-600">{t('teacher_classes.students_count', { count: classe.student_count })}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-slate-400 italic bg-white rounded-3xl border border-slate-200 border-dashed">
            {t('teacher_classes.no_classes')}
          </div>
        )}
      </div>
    </div>
  );
}