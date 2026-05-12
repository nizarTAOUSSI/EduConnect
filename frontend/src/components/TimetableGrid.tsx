import { useState, useEffect } from 'react';
import api from '../api/axios';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import { Clock, User, BookOpen, Trash2, Edit2, School, AlertCircle, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Seance {
  id: number;
  type?: 'seance' | 'evaluation';
  evaluation_type?: string;
  matiere: string;
  enseignant: string;
  enseignant_id?: number;
  salle?: string;
  salle_id?: number;
  heure_debut: string;
  heure_fin: string;
  date?: string; // For evaluations
  classe?: string;
}

interface TimetableData {
  [key: string]: Seance[];
}

interface TimetableGridProps {
  classeId?: number | string;
  isTeacherGlobal?: boolean;
  isAdmin?: boolean;
  currentTeacherId?: number;
  onDelete?: (id: number, isEvaluation?: boolean) => void;
  onEdit?: (seance: any) => void;
}

const getProgression = (heureDebut: string, heureFin: string) => {
  const now = new Date();
  const [hStart, mStart] = heureDebut.split(':').map(Number);
  const [hEnd, mEnd] = heureFin.split(':').map(Number);

  const start = new Date();
  start.setHours(hStart, mStart, 0);

  const end = new Date();
  end.setHours(hEnd, mEnd, 0);

  if (now < start || now > end) return null;

  const total = end.getTime() - start.getTime();
  const current = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, (current / total) * 100));
};

export default function TimetableGrid({ 
  classeId, 
  isTeacherGlobal,
  isAdmin, 
  currentTeacherId, 
  onDelete, 
  onEdit 
}: TimetableGridProps) {
  const { t } = useTranslation();
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
  const [, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const DAYS = [
    { key: 'lundi', label: t('timetable_grid.days.lundi') },
    { key: 'mardi', label: t('timetable_grid.days.mardi') },
    { key: 'mercredi', label: t('timetable_grid.days.mercredi') },
    { key: 'jeudi', label: t('timetable_grid.days.jeudi') },
    { key: 'vendredi', label: t('timetable_grid.days.vendredi') },
    { key: 'samedi', label: t('timetable_grid.days.samedi') },
    { key: 'dimanche', label: t('timetable_grid.days.dimanche') },
  ];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setError(null);
        let url = '';
        if (isTeacherGlobal) {
          url = '/academics/seances/mon-emploi/';
        } else if (classeId) {
          url = `/academics/classes/${classeId}/emploi/`;
        } else {
          setLoading(false);
          return;
        }
        
        const res = await api.get(url);
           
        const updatedData = { ...res.data };

        setTimetable(updatedData);
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'emploi du temps', error);
        setError(error.response?.status === 404 ? t('timetable_grid.endpoint_error') : t('timetable_grid.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [classeId, isTeacherGlobal, onDelete, onEdit, t]); // Refresh if actions happen

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-6 bg-red-50 rounded-3xl border border-dashed border-red-200 text-red-600">
        <p className="font-bold">{error}</p>
        <p className="text-sm mt-2">{t('timetable_grid.retry_error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {DAYS.map((day) => {
          const seances = timetable?.[day.key] || [];
          
          return (            <div key={day.key} className="space-y-4">
              <div className="bg-slate-100/80 rounded-2xl py-3 px-4 text-center">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{day.label}</span>
              </div>

              <div className="space-y-3 min-h-[100px]">
                {seances.length > 0 ? (
                  seances.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)).map((seance, idx) => {
                    const isEval = seance.type === 'evaluation';
                    const progression = getProgression(seance.heure_debut, seance.heure_fin);
                    const isActive = progression !== null;

                    return (
                      <div 
                        key={idx}
                        onClick={() => setSelectedSeance(seance)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg active:scale-[0.98] group relative overflow-hidden ${
                          isActive 
                            ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-xl z-10' 
                            : ''
                        } ${
                          isEval 
                            ? 'bg-rose-50/50 border-rose-100 hover:border-rose-300' 
                            : 'bg-white border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full">
                            <div 
                              className="h-full bg-primary transition-all duration-1000" 
                              style={{ width: `${progression}%` }}
                            />
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${
                            isEval ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {isEval ? t('timetable_grid.evaluation') : t('timetable_grid.course')}
                          </span>
                          {(isAdmin || (isTeacherGlobal && seance.enseignant_id === currentTeacherId)) && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(seance); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDelete?.(seance.id, isEval); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{seance.matiere}</h4>
                        <div className="flex flex-col gap-1 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{seance.heure_debut.substring(0, 5)} - {seance.heure_fin.substring(0, 5)}</span>
                          </div>
                          {seance.date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              <span className="text-[10px] font-bold">{seance.date}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full border-2 border-dashed border-slate-50 rounded-2xl flex items-center justify-center p-4">
                    <span className="text-[10px] text-slate-300 font-medium italic text-center">{t('timetable_grid.no_seance')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal 
        isOpen={!!selectedSeance} 
        onClose={() => setSelectedSeance(null)}
        title={selectedSeance?.type === 'evaluation' ? t('timetable_grid.evaluation_details') : t('timetable_grid.seance_details')}
      >
        {selectedSeance && (
          <div className="space-y-6 py-2">
            <div className={`p-6 rounded-3xl border-2 ${selectedSeance.type === 'evaluation' ? 'bg-rose-50/30 border-rose-100' : 'bg-emerald-50/30 border-emerald-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedSeance.type === 'evaluation' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedSeance.matiere}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${selectedSeance.type === 'evaluation' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {selectedSeance.type === 'evaluation' ? t('timetable_grid.evaluation') : t('timetable_grid.course')}
                    </span>
                    {selectedSeance.evaluation_type && (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedSeance.evaluation_type}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('timetable_grid.type')}</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{selectedSeance.heure_debut.substring(0, 5)} - {selectedSeance.heure_fin.substring(0, 5)}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                  <School className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('timetable_grid.room')}</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{selectedSeance.salle || t('timetable_grid.not_assigned')}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('timetable_grid.teacher')}</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{selectedSeance.enseignant || t('timetable_grid.unspecified')}</p>
              </div>

              {selectedSeance.classe && (
                <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('timetable_grid.class')}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{selectedSeance.classe}</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setSelectedSeance(null)}
                className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
