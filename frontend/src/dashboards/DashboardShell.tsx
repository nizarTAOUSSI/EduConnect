import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Logo.png';

export default function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="sticky top-0 z-40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-full px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <div className="w-12">
                  <img src={logo} alt="Logo" className="w-full h-full" />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  EduConnect
                </span>
              </Link>

              <div className="hidden md:block h-8 w-px bg-slate-200/70" />

              <div className="hidden md:flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate">{title}</span>
                <span className="text-xs text-slate-500 truncate">
                  {user?.first_name} {user?.last_name} ·{' '}
                  <span className="capitalize">{user?.role}</span>
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>

          <div className="md:hidden mt-3 px-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{title}</span>
              <span className="text-xs text-slate-500">
                {user?.first_name} {user?.last_name} ·{' '}
                <span className="capitalize">{user?.role}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

