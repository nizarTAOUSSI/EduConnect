import { useEffect, useState } from 'react';
import { MessageSquare, Send, Clock, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Table, { Td } from '../../components/ui/Table';

interface Note {
  id: number;
  valeur_note: number | null;
  commentaire: string;
  est_absent: boolean;
  evaluation_details: {
    id: number;
    type_display: string;
    matiere_name: string;
    date: string;
    enseignant_name: string;
    enseignant_id: number;
    matiere_id: number;
  };
}

interface Reclamation {
  id: number;
  objet: string;
  message: string;
  reponse_enseignant: string;
  statut: 'en_attente' | 'traitee' | 'rejetee';
  date_creation: string;
  evaluation_details?: {
    type_display: string;
    matiere_name: string;
  };
}

export default function StudentReclamations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const etudiantsRes = await api.get('/accounts/etudiants/');
      const etudiantsData = etudiantsRes.data.results || etudiantsRes.data;
      const myProfile = etudiantsData.find((e: any) => e.utilisateur === user?.id);

      if (!myProfile) {
        toast.error(t('student_reclamations.messages.profile_not_found'));
        return;
      }

      const [notesRes, reclamRes] = await Promise.all([
        api.get(`/grades/notes/?etudiant=${myProfile.id}`),
        api.get(`/communication/reclamations/?expediteur=${myProfile.utilisateur}`)
      ]);

      setNotes(notesRes.data.results || notesRes.data);
      setReclamations(reclamRes.data.results || reclamRes.data);
    } catch (error) {
      toast.error(t('student_reclamations.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote) return;

    const enseignantId = selectedNote.evaluation_details.enseignant_id;
    if (!enseignantId) {
      toast.error(t('student_reclamations.messages.no_teacher'));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/grades/reclamations/', {
        evaluation: selectedNote.evaluation_details.id,
        enseignant: enseignantId,
        objet: `Réclamation : ${selectedNote.evaluation_details.matiere_name} - ${selectedNote.evaluation_details.type_display}`,
        message: message
      });

      toast.success(t('student_reclamations.messages.send_success'));
      setIsModalOpen(false);
      setMessage('');
      fetchData();
    } catch (error) {
      toast.error(t('student_reclamations.messages.send_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_attente': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'traitee': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'rejetee': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'traitee': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejetee': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('student_reclamations.title')}</h1>
        <p className="text-slate-500 mt-1">{t('student_reclamations.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{reclamations.filter(r => r.statut === 'en_attente').length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('student_reclamations.stats.pending')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{reclamations.filter(r => r.statut === 'traitee').length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('student_reclamations.stats.treated')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{reclamations.filter(r => r.statut === 'rejetee').length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('student_reclamations.stats.rejected')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notes Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">{t('student_reclamations.notes_section.title')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('student_reclamations.notes_section.subtitle')}</p>
          </div>
          <div className="overflow-x-auto">
            <Table columns={[t('student_reclamations.notes_section.table.evaluation'), t('student_reclamations.notes_section.table.grade'), t('common.actions')]} isEmpty={notes.length === 0}>
              {notes.map((note) => (
                <tr key={note.id} className="hover:bg-slate-50/50 transition-colors group">
                  <Td>
                    <div>
                      <p className="font-bold text-slate-900 leading-none mb-1">{note.evaluation_details.matiere_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{note.evaluation_details.type_display} • {note.evaluation_details.date}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className={`font-black ${note.est_absent ? 'text-rose-500' : 'text-indigo-600'}`}>
                      {note.est_absent ? t('common.absent') : (note.valeur_note !== null ? `${note.valeur_note}/20` : t('student_reclamations.notes_section.table.not_graded'))}
                    </span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => { setSelectedNote(note); setIsModalOpen(true); }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                      title={t('student_reclamations.notes_section.claim')}
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        </div>

        {/* Reclamations List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">{t('student_reclamations.reclamations_section.title')}</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {reclamations.length > 0 ? reclamations.map((rec) => (
              <div key={rec.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${getStatusClass(rec.statut)}`}>
                      {getStatusIcon(rec.statut)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-none mb-1">{rec.objet}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{rec.date_creation}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusClass(rec.statut)}`}>
                    {t(`student_reclamations.status.${rec.statut}`)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed">{rec.message}</p>
                </div>
                {rec.reponse_enseignant && (
                  <div className="mt-3 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t('student_reclamations.reclamations_section.teacher_reply')}</p>
                    <p className="text-sm text-emerald-700 italic">{rec.reponse_enseignant}</p>
                  </div>
                )}
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic">
                <Send className="w-12 h-12 mx-auto mb-4 opacity-10" />
                {t('student_reclamations.reclamations_section.no_reclamations')}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('student_reclamations.modal.title')}
        maxWidth="md"
      >
        {selectedNote && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('student_reclamations.modal.note_details')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{t('student_reclamations.modal.evaluation')}</p>
                  <p className="text-sm font-bold text-slate-900">{selectedNote.evaluation_details.type_display}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{t('student_reclamations.modal.subject')}</p>
                  <p className="text-sm font-bold text-slate-900">{selectedNote.evaluation_details.matiere_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{t('student_reclamations.modal.grade')}</p>
                  <p className="text-sm font-bold text-indigo-600">{selectedNote.valeur_note}/20</p>
                </div>
                {selectedNote.commentaire && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{t('student_reclamations.modal.comment')}</p>
                    <p className="text-sm text-slate-600 italic">"{selectedNote.commentaire}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('student_reclamations.modal.your_claim')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder={t('student_reclamations.modal.placeholder')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[120px]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Spinner className="w-4 h-4 text-white" /> : <Send className="w-4 h-4" />}
                {t('student_reclamations.modal.submit')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}