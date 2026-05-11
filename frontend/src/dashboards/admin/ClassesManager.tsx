import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import Table, { Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useTranslation } from 'react-i18next';

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  effectif?: number;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Assignment {
  id: number;
  enseignant_name: string;
  matiere_name: string;
}

export default function ClassesManager() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<Partial<Classe> | null>(null);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // States for Details Modals
  const [viewingStudents, setViewingStudents] = useState<{ isOpen: boolean; class: Classe | null; data: Student[]; loading: boolean }>({ isOpen: false, class: null, data: [], loading: false });
  const [viewingAssignments, setViewingAssignments] = useState<{ isOpen: boolean; class: Classe | null; data: Assignment[]; loading: boolean }>({ isOpen: false, class: null, data: [], loading: false });
  const [detailsSearch, setDetailsSearch] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academics/classes/');
      setClasses(res.data.results || res.data);
    } catch (error) {
      toast.error(t('classes_manager.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [t]);

  const fetchClassStudents = async (classe: Classe) => {
    setViewingStudents({ isOpen: true, class: classe, data: [], loading: true });
    try {
      const res = await api.get(`/accounts/etudiants/?classe=${classe.id}`);
      setViewingStudents(prev => ({ ...prev, data: res.data.results || res.data, loading: false }));
    } catch {
      toast.error(t('classes_manager.messages.load_students_error'));
      setViewingStudents(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchClassAssignments = async (classe: Classe) => {
    setViewingAssignments({ isOpen: true, class: classe, data: [], loading: true });
    try {
      const res = await api.get(`/academics/enseignant-matieres/?classe=${classe.id}`);
      setViewingAssignments(prev => ({ ...prev, data: res.data.results || res.data, loading: false }));
    } catch {
      toast.error(t('classes_manager.messages.load_assignments_error'));
      setViewingAssignments(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteClick = (id: number) => {
    setClassToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      setIsActionLoading(true);
      await api.delete(`/academics/classes/${classToDelete}/`);
      toast.success(t('classes_manager.messages.delete_success'));
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
      fetchClasses();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get('nom'),
      niveau: formData.get('niveau')
    };

    try {
      if (currentClass?.id) {
        await api.patch(`/academics/classes/${currentClass.id}/`, data);
        toast.success(t('classes_manager.messages.update_success'));
      } else {
        await api.post('/academics/classes/', data);
        toast.success(t('classes_manager.messages.save_success'));
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast.error(t('common.error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.niveau.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{t('classes_manager.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('classes_manager.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setCurrentClass(null);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('classes_manager.add_class')}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('classes_manager.search_placeholder')}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <Table
              columns={[t('classes_manager.table.class'), t('classes_manager.table.level'), t('classes_manager.table.students'), t('classes_manager.table.assignments'), t('common.actions')]}
              isEmpty={filteredClasses.length === 0}
            >
              {filteredClasses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <Td><span className="font-bold text-slate-900">{c.nom}</span></Td>
                  <Td>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                      {t(`classes_manager.levels.${c.niveau[0]}`)}
                    </span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => fetchClassStudents(c)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      {t('common.view')}
                    </button>
                  </Td>
                  <Td>
                    <button
                      onClick={() => fetchClassAssignments(c)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {t('common.view')}
                    </button>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => {
                          setCurrentClass(c);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(c.id)}
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
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentClass ? t('classes_manager.edit_class') : t('classes_manager.create_class')}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('common.name')}</label>
            <input
              name="nom"
              defaultValue={currentClass?.nom}
              placeholder="Ex: 1A, Terminale S1..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('common.level')}</label>
            <select
              name="niveau"
              defaultValue={currentClass?.niveau || '1'}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium"
            >
              <option value="1">{t('classes_manager.levels.1')}</option>
              <option value="2">{t('classes_manager.levels.2')}</option>
              <option value="3">{t('classes_manager.levels.3')}</option>
              <option value="4">{t('classes_manager.levels.4')}</option>
              <option value="5">{t('classes_manager.levels.5')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isActionLoading && <Spinner className="w-4 h-4" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Students List Modal */}
      <Modal
        isOpen={viewingStudents.isOpen}
        onClose={() => { setViewingStudents(prev => ({ ...prev, isOpen: false })); setDetailsSearch(''); }}
        title={t('classes_manager.modals.students_title', { name: viewingStudents.class?.nom })}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('classes_manager.modals.filter_students')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none transition-all"
              value={detailsSearch}
              onChange={(e) => setDetailsSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {viewingStudents.loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <div className="space-y-2">
                {viewingStudents.data
                  .filter(s => (s.first_name + ' ' + s.last_name + ' ' + s.email).toLowerCase().includes(detailsSearch.toLowerCase()))
                  .map(student => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                {viewingStudents.data.length === 0 && (
                  <div className="text-center py-12 text-slate-400 italic text-sm">{t('common.no_data')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Assignments Modal */}
      <Modal
        isOpen={viewingAssignments.isOpen}
        onClose={() => { setViewingAssignments(prev => ({ ...prev, isOpen: false })); setDetailsSearch(''); }}
        title={t('classes_manager.modals.assignments_title', { name: viewingAssignments.class?.nom })}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('classes_manager.modals.filter_assignments')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none transition-all"
              value={detailsSearch}
              onChange={(e) => setDetailsSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {viewingAssignments.loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <div className="space-y-3">
                {viewingAssignments.data
                  .filter(a => (a.matiere_name + ' ' + a.enseignant_name).toLowerCase().includes(detailsSearch.toLowerCase()))
                  .map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{assignment.matiere_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <p className="text-sm font-medium text-slate-500">{assignment.enseignant_name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {viewingAssignments.data.length === 0 && (
                  <div className="text-center py-12 text-slate-400 italic text-sm">
                    {t('classes_manager.modals.no_assignments')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('common.delete')}
        message={t('common.confirm')}
        isLoading={isActionLoading}
      />
    </div>
  );
}