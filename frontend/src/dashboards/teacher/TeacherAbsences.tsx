import { useEffect, useState } from 'react';
import { Clock, Plus, Search, Calendar, Users, UserX, Activity, History, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

interface Absence {
  id: number;
  etudiant: number;
  enseignant_matiere: number;
  seance: number;
  date: string;
  motif: string;
  justifiee: boolean;
  duree_heures: number;
  etudiant_details?: {
    utilisateur: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  enseignant_matiere_details?: {
    id: number;
    matiere_name: string;
    classe_name: string;
    enseignant_name: string;
  };
  seance_details?: {
    heure_debut: string;
    heure_fin: string;
    jour_display: string;
  };
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

interface Seance {
  id: number;
  matiere: number;
  matiere_name: string;
  enseignant_matiere: number;
  enseignant_name: string;
  classe: number;
  classe_name: string;
  jour: string;
  jour_display: string;
  heure_debut: string;
  heure_fin: string;
}

interface GroupedSession {
  date: string;
  seance_id: number;
  seance_name: string;
  classe_name: string;
  classe_id: number;
  heure_debut: string;
  heure_fin: string;
  absent_count: number;
  absences: Absence[];
}

export default function TeacherAbsences() {
  const { t } = useTranslation();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<number, Student[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<number | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<number, { absent: boolean; absence_id?: number }>>({});
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // History states
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await api.get('/accounts/auth/me/');
        const user = userRes.data;

        if (user.role !== 'enseignant') {
          toast.error(t('student_reclamations.messages.access_denied'));
          return;
        }

        const [seancesRes, absRes] = await Promise.all([
          api.get('/academics/seances/'),
          api.get('/academics/absences/'),
        ]);

        const teacherSeances = seancesRes.data.results || seancesRes.data;
        const allAbsences = absRes.data.results || absRes.data;
        
        setSeances(teacherSeances);
        setAbsences(allAbsences);

        // Extract unique classes from seances
        const uniqueClassesMap = new Map();
        teacherSeances.forEach((s: Seance) => {
          if (!uniqueClassesMap.has(s.classe)) {
            uniqueClassesMap.set(s.classe, { id: s.classe, nom: s.classe_name });
          }
        });
        setClasses(Array.from(uniqueClassesMap.values()));

      } catch (error) {
        console.error(error);
        toast.error(t('teacher_absences.messages.load_error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    if (selectedSeance && attendanceDate) {
      const sessionAbsences = absences.filter(a => a.date === attendanceDate && a.seance === selectedSeance);
      const newAttendanceData: Record<number, { absent: boolean; absence_id?: number }> = {};
      
      sessionAbsences.forEach(abs => {
        newAttendanceData[abs.etudiant] = { absent: true, absence_id: abs.id };
      });
      setAttendanceData(newAttendanceData);
    }
  }, [selectedSeance, attendanceDate, absences]);

  const loadStudentsForClass = async (classId: number) => {
    if (students[classId]) return;
    try {
      const res = await api.get(`/accounts/etudiants/?classe=${classId}`);
      setStudents(prev => ({ ...prev, [classId]: res.data.results || res.data }));
    } catch (error) {
      toast.error(t('teacher_absences.messages.load_students_error'));
    }
  };

  const openAttendanceModal = async (classId: number, date?: string, seanceId?: number) => {
    setSelectedClass(classId);
    await loadStudentsForClass(classId);
    
    if (date && seanceId) {
      setAttendanceDate(date);
      setSelectedSeance(seanceId);
    } else {
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setSelectedSeance(null);
      setAttendanceData({});
    }
    
    setIsAttendanceModalOpen(true);
  };

  const submitAttendance = async () => {
    if (!selectedClass || !selectedSeance) {
      toast.error(t('teacher_absences.messages.select_session_error'));
      return;
    }

    const seance = seances.find(s => s.id === selectedSeance);
    if (!seance) return;

    // Validation locale de la date
    const daysMap: Record<number, string> = {
      0: 'dimanche',
      1: 'lundi',
      2: 'mardi',
      3: 'mercredi',
      4: 'jeudi',
      5: 'vendredi',
      6: 'samedi'
    };
    const dateParts = attendanceDate.split('-');
    const selectedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const dayOfDate = daysMap[selectedDate.getDay()];

    if (dayOfDate !== seance.jour) {
      toast.error(t('teacher_absences.messages.date_mismatch_error', { date: attendanceDate, day: dayOfDate, sessionDay: seance.jour }));
      return;
    }

    try {
      setIsActionLoading(true);
      
      const currentSessionAbsences = absences.filter(a => a.date === attendanceDate && a.seance === selectedSeance);
      
      const promises: Promise<any>[] = [];

      // 1. Process deletions (students marked as present but were absent before)
      currentSessionAbsences.forEach(oldAbs => {
        if (!attendanceData[oldAbs.etudiant]?.absent) {
          promises.push(api.delete(`/academics/absences/${oldAbs.id}/`));
        }
      });

      // 2. Process additions (students newly marked as absent)
      Object.entries(attendanceData).forEach(([studentId, data]) => {
        if (data.absent && !data.absence_id) {
          promises.push(api.post('/academics/absences/', {
            enseignant_matiere: seance.enseignant_matiere,
            seance: seance.id,
            etudiant: parseInt(studentId),
            date: attendanceDate,
            motif: '',
            justifiee: false,
          }));
        }
      });

      await Promise.all(promises);
      toast.success(t('teacher_absences.messages.save_success'));
      // On recharge les données pour mettre à jour l'historique
      const [newSeancesRes, newAbsRes] = await Promise.all([
        api.get('/academics/seances/'),
        api.get('/academics/absences/'),
      ]);
      setSeances(newSeancesRes.data.results || newSeancesRes.data);
      setAbsences(newAbsRes.data.results || newAbsRes.data);
      
      setIsAttendanceModalOpen(false);

    } catch (error: any) {
      toast.error(t('teacher_absences.messages.save_error') + ' : ' + (error.response?.data?.non_field_errors?.[0] || ''));
    } finally {
      setIsActionLoading(false);
    }
  };

  const getGroupedSessions = (): GroupedSession[] => {
    const sessionsMap = new Map<string, GroupedSession>();

    absences.forEach(abs => {
      const key = `${abs.date}-${abs.seance}`;
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, {
          date: abs.date,
          seance_id: abs.seance,
          seance_name: abs.enseignant_matiere_details?.matiere_name || 'Inconnue',
          classe_name: abs.enseignant_matiere_details?.classe_name || 'Inconnue',
          classe_id: seances.find(s => s.id === abs.seance)?.classe || 0,
          heure_debut: abs.seance_details?.heure_debut || '--:--',
          heure_fin: abs.seance_details?.heure_fin || '--:--',
          absent_count: 0,
          absences: []
        });
      }
      const session = sessionsMap.get(key)!;
      session.absent_count++;
      session.absences.push(abs);
    });

    return Array.from(sessionsMap.values())
      .filter(s => !filterDate || s.date === filterDate)
      .sort((a, b) => b.date.localeCompare(a.date) || a.heure_debut.localeCompare(b.heure_debut));
  };

  const getSeancesForClass = (classId: number) => {
    return seances.filter(s => s.classe === classId);
  };

  const currentClassStudents = selectedClass ? students[selectedClass] || [] : [];
  const historySessions = getGroupedSessions();

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('teacher_absences.title')}</h1>
          <p className="text-slate-500 mt-1">{t('teacher_absences.subtitle')}</p>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border-none focus:ring-0 text-sm font-bold text-slate-700 bg-transparent"
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Classes for Attendance */}
          <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Users className="w-5 h-5" />
                </div>
                {t('teacher_absences.attendance_section.title')}
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((classe) => (
                  <button 
                    key={classe.id} 
                    onClick={() => openAttendanceModal(classe.id)}
                    className="flex flex-col items-start p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between w-full mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <Plus className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:rotate-90 transition-all" />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight">{classe.nom}</h4>
                    <p className="text-sm text-slate-500 mt-1">{t('teacher_absences.attendance_section.launch_sheet')}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* History of Sessions */}
          <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <History className="w-5 h-5" />
                </div>
                {t('teacher_absences.history_section.title')}
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {t('teacher_absences.history_section.count', { count: historySessions.length })}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {historySessions.length > 0 ? historySessions.map((session, idx) => (
                <div 
                  key={idx} 
                  className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => openAttendanceModal(session.classe_id, session.date, session.seance_id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">{t('student_absences.table.date')}</span>
                      <span className="text-sm font-black text-slate-900">{session.date.split('-')[2]}/{session.date.split('-')[1]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{session.seance_name}</h4>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {session.classe_name}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {session.heure_debut} - {session.heure_fin}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('teacher_absences.history_section.absent_students')}</p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`text-lg font-black ${session.absent_count > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {session.absent_count}
                        </span>
                        <UserX className={`w-4 h-4 ${session.absent_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <Edit2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center text-slate-400 italic">
                  {t('teacher_absences.history_section.no_history')}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <Activity className="w-10 h-10 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-2">{t('teacher_absences.stats.global_summary')}</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{t('teacher_absences.stats.stats_desc')}</p>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{t('teacher_absences.stats.total_absences')}</p>
                  <p className="text-3xl font-black">{absences.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{t('teacher_absences.stats.sessions_managed')}</p>
                  <p className="text-2xl font-black text-primary">{new Set(absences.map(a => `${a.date}-${a.seance}`)).size}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isAttendanceModalOpen} 
        onClose={() => setIsAttendanceModalOpen(false)} 
        title={`${attendanceData[Object.keys(attendanceData)[0] as any]?.absence_id ? t('common.edit') : t('teacher_absences.modal.title_create')} - ${classes.find(c => c.id === selectedClass)?.nom || ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-8 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('teacher_absences.modal.course_date')}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 font-bold text-slate-900" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('teacher_absences.modal.session_subject')}</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select 
                  value={selectedSeance || ''}
                  onChange={(e) => setSelectedSeance(parseInt(e.target.value))}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 font-bold text-slate-900 appearance-none"
                >
                  <option value="">{t('teacher_absences.modal.select_session')}</option>
                  {selectedClass && getSeancesForClass(selectedClass).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.matiere_name} ({s.heure_debut} - {s.heure_fin})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">{t('teacher_absences.modal.student_list')}</h4>
            <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {currentClassStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${attendanceData[student.id]?.absent ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none">{student.first_name} {student.last_name}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{student.code_apogee}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setAttendanceData(prev => ({
                        ...prev,
                        [student.id]: { 
                          ...prev[student.id],
                          absent: !prev[student.id]?.absent
                        }
                      }))}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        attendanceData[student.id]?.absent 
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-300 hover:text-emerald-500'
                      }`}
                    >
                      {attendanceData[student.id]?.absent ? t('teacher_absences.modal.absent') : t('teacher_absences.modal.present')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button 
              onClick={() => setIsAttendanceModalOpen(false)}
              className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
            >
              {t('common.cancel')}
            </button>
            <button 
              onClick={submitAttendance}
              disabled={isActionLoading || !selectedSeance}
              className="px-10 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
