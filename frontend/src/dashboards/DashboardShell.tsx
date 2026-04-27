import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">{title}</span>
            <span className="text-xs text-slate-500">
              {user?.first_name} {user?.last_name} · <span className="capitalize">{user?.role}</span>
            </span>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

