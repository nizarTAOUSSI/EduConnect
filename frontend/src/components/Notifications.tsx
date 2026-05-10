import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: 'absence' | 'note' | 'reclamation' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/communication/notifications/');
        const data = response.data.results || response.data;
        // Handle field transition and ensure boolean
        const normalizedData = Array.isArray(data) ? data.map((n: any) => ({
          ...n,
          is_read: n.is_read !== undefined ? n.is_read : (n.est_lu !== undefined ? n.est_lu : false)
        })) : [];
        setNotifications(normalizedData);
      } catch (error) {
        toast.error('Erreur lors du chargement des notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/communication/notifications/${notificationId}/`, { is_read: true });
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      // Dispatch event to update sidebar counts
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => api.patch(`/communication/notifications/${id}/`, { is_read: true })));
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      toast.success('Toutes les notifications ont été marquées comme lues');
      // Dispatch event to update sidebar counts
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'absence': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'note': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'reclamation': return <Info className="w-5 h-5 text-blue-500" />;
      case 'system': return <Bell className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'absence': return 'border-red-200 bg-red-50';
      case 'note': return 'border-green-200 bg-green-50';
      case 'reclamation': return 'border-blue-200 bg-blue-50';
      case 'system': return 'border-purple-200 bg-purple-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1">Restez informé des dernières mises à jour.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Tout marquer comme lu ({unreadCount})
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => !notification.is_read && markAsRead(notification.id)}
            className={`p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden ${
              notification.is_read
                ? 'border-slate-100 bg-white opacity-60'
                : `${getNotificationColor(notification.type)} border-opacity-100 border-[3px] shadow-xl scale-[1.03] z-10 bg-white ring-4 ring-offset-0 cursor-pointer hover:shadow-2xl active:scale-[1.01] ${
                    notification.type === 'absence' ? 'ring-red-100' : 
                    notification.type === 'note' ? 'ring-green-100' : 
                    notification.type === 'reclamation' ? 'ring-blue-100' : 'ring-purple-100'
                  }`
            }`}
          >
            {!notification.is_read && (
              <div className="absolute top-0 right-0">
                <div className={`${
                  notification.type === 'absence' ? 'bg-red-600' : 
                  notification.type === 'note' ? 'bg-green-600' : 
                  notification.type === 'reclamation' ? 'bg-blue-600' : 'bg-primary'
                } text-white text-[12px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-[0.2em] shadow-lg animate-pulse border-l border-b border-white/20`}>
                  Nouveau
                </div>
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl shadow-sm transition-transform duration-500 ${!notification.is_read ? 'scale-110 rotate-3' : ''} ${notification.is_read ? 'bg-slate-50' : 'bg-white border border-slate-100'}`}>
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`tracking-tight mb-1 ${notification.is_read ? 'font-bold text-slate-500 text-lg' : 'font-black text-slate-900 text-xl'}`}>
                      {notification.title}
                    </h3>
                    <p className={`leading-relaxed ${notification.is_read ? 'font-medium text-slate-400 text-sm' : 'font-bold text-slate-700 text-base'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      {!notification.is_read && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          notification.type === 'absence' ? 'bg-red-100 text-red-600' : 
                          notification.type === 'note' ? 'bg-green-100 text-green-600' : 
                          notification.type === 'reclamation' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                          À consulter
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Aucune notification</h3>
            <p className="text-slate-400">
              Vous n'avez pas encore de notifications.
            </p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">{notifications.length}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {notifications.filter(n => n.type === 'absence').length}
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Absences</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {notifications.filter(n => n.type === 'note').length}
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Notes</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <Info className="w-8 h-8" />
          </div>
          <p className="text-3xl font-black text-slate-900">
            {notifications.filter(n => n.type === 'reclamation').length}
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Réclamations</p>
        </div>
      </div>
    </div>
  );
}