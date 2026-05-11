import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import TimetableGrid from '../../components/TimetableGrid';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function ParentTimetable() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const parentRes = await api.get('/accounts/parents/');
        const parentsData = Array.isArray(parentRes.data) ? parentRes.data : (parentRes.data.results || [parentRes.data]);
        
        // Find the specific profile for the current user
        const parent = parentsData.find((p: any) => 
          p.utilisateur === user?.id || 
          (p.utilisateur && p.utilisateur.id === user?.id)
        );
        
        if (parent) {
          let childrenData = [];
          if (parent.enfants_details) {
            childrenData = parent.enfants_details;
          } else if (parent.enfants) {
            const childrenPromises = parent.enfants.map((id: number) => api.get(`/accounts/etudiants/${id}/`));
            const childrenRes = await Promise.all(childrenPromises);
            childrenData = childrenRes.map(r => r.data);
          }
          
          setChildren(childrenData);
          if (childrenData.length > 0) {
            setSelectedChildId(childrenData[0].id);
          }
        }
      } catch (error) {
        toast.error(t('parent_timetable.messages.load_children_error'));
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchChildren();
  }, [user, t]);

  const selectedChild = children.find(c => c.id === parseInt(selectedChildId as string));

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="text-emerald-600" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('parent_timetable.title')}</h1>
        <p className="text-slate-500 mt-1">{t('parent_timetable.subtitle')}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-end gap-6 mb-8">
          <div className="space-y-2 flex-1 max-w-xs">
            <label className="text-sm font-bold text-slate-700 ml-1">{t('parent_timetable.select_child')}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all duration-200 appearance-none font-medium"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom_complet || `${c.first_name || ''} ${c.last_name || ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedChild?.classe ? (
          <TimetableGrid classeId={selectedChild.classe} />
        ) : (
          <div className="text-center py-20 text-slate-400">
            {selectedChildId ? t('timetable_grid.no_class_assigned') : t('timetable_grid.no_child_found')}
          </div>
        )}
      </div>
    </div>
  );
}
