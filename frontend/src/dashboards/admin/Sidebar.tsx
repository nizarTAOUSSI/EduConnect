import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, ChevronRight, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/Logo.png';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Utilisateurs', path: '/dashboard/admin/users', icon: Users },
  { name: 'Classes', path: '/dashboard/admin/classes', icon: GraduationCap },
  { name: 'Matières', path: '/dashboard/admin/matieres', icon: BookOpen },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

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
          const isActive = pathname === item.path || (item.path !== '/dashboard/admin' && pathname.startsWith(item.path));
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
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
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
