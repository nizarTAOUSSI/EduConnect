import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, ChevronRight, Users, FileSpreadsheet, Clock, MessageSquare, Calendar, Bell, PanelLeftClose, PanelLeftOpen, Languages } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import logo from '../../assets/Logo.png';
import { useTranslation } from 'react-i18next';

export default function ParentSidebar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const { t, i18n } = useTranslation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', newState.toString());
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const NAV_ITEMS = [
    { name: t('dashboard.sidebar.dashboard'), path: '/dashboard/parent', icon: LayoutDashboard },
    { name: t('dashboard.sidebar.children'), path: '/dashboard/parent/enfants', icon: Users },
    { name: t('dashboard.sidebar.timetable'), path: '/dashboard/parent/timetable', icon: Calendar },
    { name: t('dashboard.sidebar.children_grades'), path: '/dashboard/parent/notes', icon: FileSpreadsheet },
    { name: t('dashboard.sidebar.absences'), path: '/dashboard/parent/absences', icon: Clock },
    { name: t('dashboard.sidebar.complaints'), path: '/dashboard/parent/reclamations', icon: MessageSquare },
    { name: t('dashboard.sidebar.notifications'), path: '/dashboard/parent/notifications', icon: Bell, isNotification: true },
  ];

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
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="EduConnect" className="w-10 h-10 shrink-0" />
          {!isCollapsed && (
            <span className="text-xl font-bold text-slate-900 tracking-tight animate-in fade-in duration-300">
              EduConnect
            </span>
          )}
        </Link>
        <button 
          onClick={toggleSidebar}
          className={`p-1 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors ${isCollapsed ? 'absolute left-16 top-16 bg-white border border-slate-200 shadow-sm z-10' : ''}`}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard/parent' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.isNotification && unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white ${isCollapsed ? '' : 'animate-bounce'}`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.name}</span>}
              </div>
              {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 text-primary" />}
            </Link>
          );
        })}
        <button
          onClick={toggleLanguage}
          title={isCollapsed ? (i18n.language === 'fr' ? 'English' : 'Français') : ''}
          className={`absolute cursor-pointer flex items-center top-4 right-4 gap-3 p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm font-medium mb-2`}
        >
          <Languages className="w-5 h-5 text-slate-400" />
        </button>
      </nav>

      <div className={`p-4 border-t gap-4 border-slate-200 ${isCollapsed ? 'flex flex-col items-center' : ' flex justify-around items-center'}`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'px-0' : 'px-3'}`}>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{t(`roles.${user?.role}`)}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title={isCollapsed ? t('dashboard.logout') : ''}
          className={`flex cursor-pointer items-center gap-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full px-3'}`}
        >
          <LogOut className="w-5 h-5" />
          {}
        </button>
      </div>
    </aside>
  );
}