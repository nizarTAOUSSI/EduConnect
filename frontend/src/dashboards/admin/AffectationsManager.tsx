import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserCheck, BookOpen, School, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
}

interface Matiere {
  id: number;
  nom: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

interface Assignment {
  id: number;
  enseignant: number;
  matiere: number;
  classe: number;
}

interface FormData {
  enseignant: string;
  matiere: string;
  classe: string;
}

export default function AffectationsManager() {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    enseignant: '',
    matiere: '',
    classe: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignmentsRes, teachersRes, classesRes, matieresRes] = await Promise.all([
        api.get('/academics/enseignant-matieres/'),
        api.get('/accounts/enseignants/'),
        api.get('/academics/classes/'),
        api.get('/academics/matieres/'),
      ]);
      setAssignments(assignmentsRes.data.results || assignmentsRes.data);
      setTeachers(teachersRes.data.results || teachersRes.data);
      setClasses(classesRes.data.results || classesRes.data);
      setMatieres(matieresRes.data.results || matieresRes.data);
    } catch {
      toast.error(t('affectations_manager.messages.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const payload = {
        enseignant: parseInt(formData.enseignant),
        matiere: parseInt(formData.matiere),
        classe: parseInt(formData.classe),
      };
      if (editingAssignment) {
        await api.patch(`/academics/enseignant-matieres/${editingAssignment.id}/`, payload);
        toast.success(t('affectations_manager.messages.update_success'));
      } else {
        await api.post('/academics/enseignant-matieres/', payload);
        toast.success(t('affectations_manager.messages.save_success'));
      }
      setIsModalOpen(false);
      setEditingAssignment(null);
      setFormData({ enseignant: '', matiere: '', classe: '' });
      fetchData();
    } catch {
      toast.error(t('affectations_manager.messages.save_error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      enseignant: assignment.enseignant.toString(),
      matiere: assignment.matiere.toString(),
      classe: assignment.classe.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('affectations_manager.messages.delete_confirm'))) return;
    try {
      await api.delete(`/academics/enseignant-matieres/${id}/`);
      toast.success(t('affectations_manager.messages.delete_success'));
      fetchData();
    } catch {
      toast.error(t('affectations_manager.messages.delete_error'));
    }
  };

  const filteredAssignments = assignments.filter(a => {
    const teacherName = teachers.find(t => t.id === a.enseignant) 
      ? `${teachers.find(t => t.id === a.enseignant)?.first_name} ${teachers.find(t => t.id === a.enseignant)?.last_name}` 
      : '';
    const matiereName = matieres.find(m => m.id === a.matiere)?.nom || '';
    const className = classes.find(c => c.id === a.classe)?.nom || '';
    return `${teacherName} ${matiereName} ${className}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('affectations_manager.title')}</h1>
          <p className="text-slate-500 mt-1">{t('affectations_manager.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setEditingAssignment(null);
            setFormData({ enseignant: '', matiere: '', classe: '' });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-100 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('affectations_manager.add_assignment')}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('affectations_manager.search_placeholder')}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto -mx-8">
          <Table columns={[t('affectations_manager.table.teacher'), t('affectations_manager.table.subject'), t('affectations_manager.table.class'), t('common.actions')]} isEmpty={filteredAssignments.length === 0}>
            {filteredAssignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors group">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {teachers.find(t => t.id === assignment.enseignant)
                          ? `${teachers.find(t => t.id === assignment.enseignant)?.first_name} ${teachers.find(t => t.id === assignment.enseignant)?.last_name}`
                          : `Enseignant #${assignment.enseignant}`}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-slate-600">
                      {matieres.find(m => m.id === assignment.matiere)?.nom || `Matière #${assignment.matiere}`}
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-slate-600">
                      {classes.find(c => c.id === assignment.classe)?.nom || `Classe #${assignment.classe}`}
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? t('affectations_manager.edit_assignment') : t('affectations_manager.add_assignment')}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('affectations_manager.table.teacher')}</label>
            <select
              value={formData.enseignant}
              onChange={(e) => setFormData({ ...formData, enseignant: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            >
              <option value="">{t('affectations_manager.select_teacher')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('affectations_manager.table.subject')}</label>
            <select
              value={formData.matiere}
              onChange={(e) => setFormData({ ...formData, matiere: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all duration-200"
            >
              <option value="">{t('affectations_manager.select_subject')}</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('affectations_manager.table.class')}</label>
            <select
              value={formData.classe}
              onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200"
            >
              <option value="">{t('affectations_manager.select_class')}</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom} ({classe.niveau})
                </option>
              ))}
            </select>
          </div>
          <div className="pt-6 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isActionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingAssignment ? t('common.edit') : t('common.add')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
