import { useEffect, useState } from 'react';
import { MessageSquare, Send, FileText, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

interface Evaluation {
  id: number;
  type: string;
  type_display?: string;
  date: string;
  note_max: number;
  matiere: number;
  classe: number;
  matiere_name?: string;
  classe_name?: string;
  enseignant_user?: number;
  enseignant_name?: string;
}

interface Note {
  id: number;
  evaluation: number;
  etudiant: number;
  valeur_note: number | null;
  commentaire: string;
  est_absent: boolean;
  evaluation_details?: Evaluation;
}

interface Reclamation {
  id: number;
  expediteur: number;
  destinataire: number;
  message: string;
  statut: 'en_attente' | 'traitee' | 'rejetee';
  date_creation: string;
  reponse: string | null;
  note?: number;
  note_details?: Note;
}

export default function StudentReclamations() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isReclamationModalOpen, setIsReclamationModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [reclamationForm, setReclamationForm] = useState({
    message: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userRes = await api.get('/accounts/auth/me/');
        const user = userRes.data;

        if (user.role !== 'etudiant') {
          toast.error('Accès non autorisé');
          return;
        }

        const studentRes = await api.get(`/accounts/etudiants/?utilisateur=${user.id}`);
        const studentData = studentRes.data.results || studentRes.data;
        const student = Array.isArray(studentData) ? studentData[0] : studentData;

        if (!student) {
          toast.error('Profil étudiant non trouvé');
          return;
        }

        // Get student's notes with evaluation details
        const notesRes = await api.get(`/grades/notes/?etudiant=${student.id}`);
        const notesData = notesRes.data.results || notesRes.data;

        // Get evaluation details for each note
        const notesWithDetails = await Promise.all(
          notesData.map(async (note: Note) => {
            try {
              const evalRes = await api.get(`/grades/evaluations/${note.evaluation}/`);
              return { ...note, evaluation_details: evalRes.data };
            } catch (error) {
              return note;
            }
          })
        );

        setNotes(notesWithDetails);
        setStudentProfile(student);

        // Get student's reclamations
        const reclamationsRes = await api.get(`/communication/reclamations/?expediteur=${student.utilisateur}`);
        setReclamations(reclamationsRes.data.results || reclamationsRes.data);

      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openReclamationModal = (note: Note) => {
    setSelectedNote(note);
    setReclamationForm({ message: '' });
    setIsReclamationModalOpen(true);
  };

  const submitReclamation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote) return;

    try {
      const evaluation = selectedNote.evaluation_details;
      if (!evaluation) {
        toast.error('Impossible de déterminer le destinataire de la réclamation.');
        return;
      }

      let destinataireId = evaluation.enseignant_user;

      // Fallback for older evaluations without explicit teacher
      if (!destinataireId) {
        const assignmentRes = await api.get(`/academics/enseignant-matieres/?classe=${evaluation.classe}&matiere=${evaluation.matiere}`);
        const assignmentData = assignmentRes.data.results || assignmentRes.data;
        const assignment = Array.isArray(assignmentData) ? assignmentData[0] : assignmentData;
        destinataireId = assignment?.enseignant_user;
      }

      if (!destinataireId) {
        toast.error('Aucun enseignant trouvé pour cette évaluation. Veuillez contacter l\'administration.');
        return;
      }

      const reclamationData = {
        expediteur: studentProfile?.utilisateur ?? selectedNote.etudiant,
        destinataire: destinataireId,
        note: selectedNote.id,
        message: reclamationForm.message,
        statut: 'en_attente',
      };

      await api.post('/communication/reclamations/', reclamationData);

      toast.success('Réclamation envoyée avec succès');
      setIsReclamationModalOpen(false);
      setSelectedNote(null);
      setReclamationForm({ message: '' });

      // Refresh reclamations
      const userRes = await api.get('/accounts/auth/me/');
      const user = userRes.data;
      const studentRes = await api.get(`/accounts/etudiants/?utilisateur=${user.id}`);
      const studentData = studentRes.data.results || studentRes.data;
      const student = Array.isArray(studentData) ? studentData[0] : studentData;

      const reclamationsRes = await api.get(`/communication/reclamations/?expediteur=${student.utilisateur}`);
      setReclamations(reclamationsRes.data.results || reclamationsRes.data);

    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la réclamation');
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-600';
      case 'traitee': return 'bg-green-100 text-green-600';
      case 'rejetee': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'traitee': return 'Traitée';
      case 'rejetee': return 'Rejetée';
      default: return statut;
    }
  };

  const pendingCount = reclamations.filter(r => r.statut === 'en_attente').length;
  const treatedCount = reclamations.filter(r => r.statut === 'traitee').length;
  const rejectedCount = reclamations.filter(r => r.statut === 'rejetee').length;

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mes Réclamations</h1>
          <p className="text-slate-500 mt-1">Consultez vos notes et faites des réclamations.</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">{pendingCount}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">En attente</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">{treatedCount}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Traitées</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">{rejectedCount}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Rejetées</p>
        </div>
      </div>

      {/* My Notes */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Mes Notes
          </h3>
          <p className="text-sm text-slate-500 mt-1">Cliquez sur une note pour faire une réclamation</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Évaluation</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Matière</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Note</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Commentaire</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notes.length > 0 ? notes.map((note) => (
                <tr key={note.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">
                        {note.evaluation_details?.matiere_name || `Éval #${note.evaluation}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-600 font-medium">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">
                      {note.evaluation_details?.type_display || note.evaluation_details?.type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-slate-500">
                    {note.evaluation_details?.matiere_name || `Matière ${note.evaluation_details?.matiere || 'N/A'}`}
                  </td>
                  <td className="px-8 py-6">
                    {note.est_absent ? (
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Absent</span>
                    ) : (
                      <span className="text-lg font-bold text-slate-900">
                        {note.valeur_note !== null ? `${note.valeur_note}/20` : 'Non noté'}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-slate-500 max-w-xs truncate">
                    {note.commentaire || 'Aucun commentaire'}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => openReclamationModal(note)}
                      className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Réclamer
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic">
                    Aucune note disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Reclamations */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Mes Réclamations
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {reclamations.length > 0 ? reclamations.map((reclamation) => (
            <div key={reclamation.id} className="p-8 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(reclamation.statut)}`}>
                        {getStatusText(reclamation.statut)}
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {reclamation.note_details?.evaluation_details?.enseignant_name ? (
                          `Prof: ${reclamation.note_details.evaluation_details.enseignant_name}`
                        ) : 'Enseignant inconnu'}
                        <span className="mx-2 text-slate-300">|</span>
                        {reclamation.note_details?.evaluation_details?.matiere_name || 'Matière inconnue'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(reclamation.date_creation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="text-slate-700">{reclamation.message}</p>
                  </div>

                  {reclamation.reponse && (
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                      <p className="text-green-800 font-medium mb-1">Réponse de l'enseignant :</p>
                      <p className="text-green-700">{reclamation.reponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-slate-400 italic">
              Aucune réclamation envoyée.
            </div>
          )}
        </div>
      </div>

      {/* Reclamation Modal */}
      <Modal isOpen={isReclamationModalOpen} onClose={() => setIsReclamationModalOpen(false)} title="Faire une réclamation">
        <form onSubmit={submitReclamation} className="space-y-6">
          {selectedNote && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-2">Détails de la note :</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Évaluation :</span>
                  <span className="ml-2 text-slate-600">
                    {selectedNote.evaluation_details?.type_display || selectedNote.evaluation_details?.type || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Matière :</span>
                  <span className="ml-2 text-slate-600">{selectedNote.evaluation_details?.matiere_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Note :</span>
                  <span className="ml-2 text-slate-600">
                    {selectedNote.est_absent ? 'Absent' : (selectedNote.valeur_note !== null ? `${selectedNote.valeur_note}/20` : 'Non noté')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Commentaire :</span>
                  <span className="ml-2 text-slate-600">{selectedNote.commentaire || 'Aucun'}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Votre réclamation</label>
            <textarea
              value={reclamationForm.message}
              onChange={(e) => setReclamationForm(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows={6}
              placeholder="Expliquez les raisons de votre réclamation..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsReclamationModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Envoyer la réclamation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}