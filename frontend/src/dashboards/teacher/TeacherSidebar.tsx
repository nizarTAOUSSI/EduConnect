import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, ChevronRight, GraduationCap, FileSpreadsheet, Clock, MessageSquare, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import logo from '../../assets/Logo.png';

const NAV_ITEMS = [
  { name: 'Tableau de bord', path: '/dashboard/enseignant', icon: LayoutDashboard },
  { name: 'Mes Classes', path: '/dashboard/enseignant/classes', icon: GraduationCap },
  { name: 'Emploi du temps', path: '/dashboard/enseignant/timetable', icon: Calendar },
  { name: 'Gestion des Notes', path: '/dashboard/enseignant/notes', icon: FileSpreadsheet },
  { name: 'Absences', path: '/dashboard/enseignant/absences', icon: Clock },
  { name: 'Réclamations', path: '/dashboard/enseignant/reclamations', icon: MessageSquare },
  { name: 'Notifications', path: '/dashboard/enseignant/notifications', icon: Bell, isNotification: true },
];

export default function TeacherSidebar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/communication/notifications/');
        const notifs = res.data.results || res.data;
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUnreadCount();
    
    // Listen for notification updates from other components
    window.addEventListener('notification-updated', fetchUnreadCount);
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', fetchUnreadCount);
    };
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="EduConnect" className="w-10 h-10" />
          <span className="text-xl font-bold text-slate-900 tracking-tight">EduConnect</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard/enseignant' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  {item.isNotification && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-4 px-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}