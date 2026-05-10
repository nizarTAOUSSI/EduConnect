import { useState, useEffect } from 'react';
import api from '../api/axios';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import { Calendar, Clock, User, BookOpen, Trash2, Edit2, School, AlertCircle } from 'lucide-react';

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

const DAYS = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
];

export default function TimetableGrid({ 
  classeId, 
  isTeacherGlobal,
  isAdmin, 
  currentTeacherId, 
  onDelete, 
  onEdit 
}: TimetableGridProps) {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);

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
        setTimetable(res.data);
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'emploi du temps', error);
        setError(error.response?.status === 404 ? 'Endpoint non trouvé. Assurez-vous d\'avoir déployé le backend.' : 'Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [classeId, isTeacherGlobal, onDelete, onEdit]); // Refresh if actions happen

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
        <p className="text-sm mt-2">Réessayez plus tard ou contactez l'administrateur.</p>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
        Aucun emploi du temps disponible.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {DAYS.map((day) => (
          <div key={day.key} className="space-y-3">
            <div className="bg-slate-800 text-white py-2 px-3 rounded-xl text-center text-xs font-black uppercase tracking-widest shadow-sm">
              {day.label}
            </div>
            <div className="space-y-2">
              {timetable[day.key]?.length > 0 ? (
                timetable[day.key].map((seance: Seance) => {
                  const isMySeance = isTeacherGlobal || (currentTeacherId && Number(seance.enseignant_id) === Number(currentTeacherId));
                  const isEvaluation = seance.type === 'evaluation';
                  
                  return (
                    <div 
                      key={`${seance.type}-${seance.id}`} 
                      onClick={() => setSelectedSeance(seance)}
                      className={`p-3 rounded-xl border transition-all duration-200 group relative cursor-pointer overflow-hidden ${
                        isEvaluation
                          ? 'bg-amber-50 border-amber-200 shadow-sm hover:border-amber-400'
                          : isMySeance 
                            ? 'bg-emerald-600 border-emerald-500 shadow-md shadow-emerald-100' 
                            : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                      }`}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full transition-all group-hover:w-1.5 ${
                        isEvaluation ? 'bg-amber-400' : isMySeance ? 'bg-white/30' : 'bg-emerald-500'
                      }`} />
                      
                      {isAdmin && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(seance);
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 shadow-sm transition-all"
                            title="Modifier"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(seance.id, seance.type === 'evaluation');
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 shadow-sm transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="space-y-1.5 pl-1.5">
                        <div className={`flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-tight ${
                          isEvaluation ? 'text-amber-600' : isMySeance ? 'text-emerald-50' : 'text-emerald-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {seance.heure_debut} - {seance.heure_fin}
                          {isEvaluation && <span className="ml-auto text-[8px] bg-amber-200 text-amber-800 px-1 rounded">EVAL</span>}
                        </div>
                        
                        <div className={`font-bold leading-tight text-xs truncate ${
                          isEvaluation ? 'text-amber-900' : isMySeance ? 'text-white' : 'text-slate-800'
                        }`}>
                          {isEvaluation ? `[${seance.evaluation_type}] ${seance.matiere}` : seance.matiere}
                        </div>
                        
                        <div className={`flex items-center gap-1.5 text-[10px] font-medium truncate ${
                          isEvaluation ? 'text-amber-600/80' : isMySeance ? 'text-emerald-100/80' : 'text-slate-400'
                        }`}>
                          {isTeacherGlobal || isEvaluation ? (
                            <>
                              <School className="w-2.5 h-2.5" />
                              <span className="truncate">{seance.classe}</span>
                            </>
                          ) : (
                            <>
                              <User className="w-2.5 h-2.5" />
                              <span className="truncate">{seance.enseignant}</span>
                            </>
                          )}
                        </div>

                        {isEvaluation && seance.date && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-700 mt-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {seance.date}
                          </div>
                        )}

                        {seance.salle && (
                          <div className={`flex items-center gap-1.5 text-[10px] font-medium truncate ${
                            isEvaluation ? 'text-amber-600/80' : isMySeance ? 'text-emerald-100/80' : 'text-slate-400'
                          }`}>
                            <School className="w-2.5 h-2.5" />
                            <span className="truncate">Salle: {seance.salle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-16 flex items-center justify-center text-slate-300 text-[10px] italic border border-dashed border-slate-100 rounded-xl">
                  Libre
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedSeance}
        onClose={() => setSelectedSeance(null)}
        title={selectedSeance?.type === 'evaluation' ? 'Détails de l\'évaluation' : 'Détails de la séance'}
        maxWidth="sm"
      >
        {selectedSeance && (
          <div className="space-y-6 py-2">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
              selectedSeance.type === 'evaluation' 
                ? 'bg-amber-50 border-amber-100' 
                : 'bg-emerald-50 border-emerald-100'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                selectedSeance.type === 'evaluation'
                  ? 'bg-amber-500 shadow-amber-200'
                  : 'bg-emerald-600 shadow-emerald-200'
              }`}>
                {selectedSeance.type === 'evaluation' ? <AlertCircle className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 leading-none">{selectedSeance.matiere}</h4>
                <p className={`${
                  selectedSeance.type === 'evaluation' ? 'text-amber-600' : 'text-emerald-600'
                } font-bold text-sm mt-1 uppercase tracking-wider`}>
                  {selectedSeance.type === 'evaluation' ? `Évaluation: ${selectedSeance.evaluation_type}` : 'Cours de formation'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-tighter">
                  <Clock className="w-3.5 h-3.5" />
                  Horaire
                </div>
                <p className="text-slate-900 font-black">{selectedSeance.heure_debut} - {selectedSeance.heure_fin}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-tighter">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedSeance.type === 'evaluation' ? 'Date' : 'Statut'}
                </div>
                <p className={`${
                  selectedSeance.type === 'evaluation' ? 'text-amber-600' : 'text-emerald-600'
                } font-black`}>
                  {selectedSeance.type === 'evaluation' ? selectedSeance.date : 'Confirmé'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Enseignant</p>
                  <p className="text-slate-900 font-bold">{selectedSeance.enseignant}</p>
                </div>
              </div>

              {selectedSeance.classe && (
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Classe / Groupe</p>
                    <p className="text-slate-900 font-bold">{selectedSeance.classe}</p>
                  </div>
                </div>
              )}

              {selectedSeance.salle && (
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Salle</p>
                    <p className="text-slate-900 font-bold">{selectedSeance.salle}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    const item = selectedSeance;
                    setSelectedSeance(null);
                    onEdit?.(item);
                  }}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier cette {selectedSeance.type === 'evaluation' ? 'évaluation' : 'séance'}
                </button>
              )}
              <button
                onClick={() => setSelectedSeance(null)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-sm"
              >
                Fermer les détails
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
