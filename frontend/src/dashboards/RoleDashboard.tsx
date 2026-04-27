import { useAuth } from '../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import EnseignantDashboard from './EnseignantDashboard';
import EtudiantDashboard from './EtudiantDashboard';
import ParentDashboard from './ParentDashboard';

export default function RoleDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'enseignant':
      return <EnseignantDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'etudiant':
    default:
      return <EtudiantDashboard />;
  }
}

