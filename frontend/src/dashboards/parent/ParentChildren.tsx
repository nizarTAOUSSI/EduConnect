import { useEffect, useState } from 'react';
import { Mail, Phone, User } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ParentChildren() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const parentsRes = await api.get('/accounts/parents/');
        const parentsData = Array.isArray(parentsRes.data) ? parentsRes.data : (parentsRes.data.results || [parentsRes.data]);
        
        // Find the specific profile for the current user
        const myProfile = parentsData.find((p: any) => 
          p.utilisateur === user?.id || 
          (p.utilisateur && p.utilisateur.id === user?.id)
        );

        if (myProfile) {
          if (myProfile.enfants_details) {
            setChildren(myProfile.enfants_details);
          } else if (myProfile.enfants) {
            const promises = myProfile.enfants.map((id: number) => api.get(`/accounts/etudiants/${id}/`));
            const responses = await Promise.all(promises);
            setChildren(responses.map(r => r.data));
          }
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des profils enfants');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchChildren();
  }, [user]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mes Enfants</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {children.length > 0 ? children.map((child) => (
          <div key={child.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                {child.first_name?.[0]}{child.last_name?.[0]}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{child.nom_complet || `${child.first_name || ''} ${child.last_name || ''}`}</h3>
                <p className="text-primary font-bold">{child.classe_name || 'Classe non assignée'}</p>
                <p className="text-slate-400 text-sm font-medium mt-1">Code: {child.code_apogee || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
                </div>
                <p className="text-sm font-bold text-slate-700">{child.email || 'Non renseigné'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Contact</span>
                </div>
                <p className="text-sm font-bold text-slate-700">Non renseigné</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-2 text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic">
            <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
            Aucun enfant trouvé.
          </div>
        )}
      </div>
    </div>
  );
}