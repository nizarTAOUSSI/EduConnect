
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Ecosystem from './components/Ecosystem';
import Guarantees from './components/Guarantees';
import Footer from './components/Footer';
import { useAuth } from './hooks/useAuth';
import RoleDashboard from './dashboards/RoleDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import EnseignantDashboard from './dashboards/EnseignantDashboard';
import EtudiantDashboard from './dashboards/EtudiantDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import RequireAuth from './routes/RequireAuth';
import RequireRole from './routes/RequireRole';

function App() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // After login (or user bootstrap on refresh), land on the correct dashboard route.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (location.pathname.startsWith('/dashboard')) return;

    switch (user.role) {
      case 'admin':
        navigate('/dashboard/admin', { replace: true });
        break;
      case 'enseignant':
        navigate('/dashboard/enseignant', { replace: true });
        break;
      case 'parent':
        navigate('/dashboard/parent', { replace: true });
        break;
      case 'etudiant':
      default:
        navigate('/dashboard/etudiant', { replace: true });
        break;
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-white">
            <Navbar />
            <main>
              <Hero />
              <Features />
              <Ecosystem />
              <Guarantees />
            </main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RoleDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/dashboard/enseignant"
        element={
          <RequireRole role="enseignant">
            <EnseignantDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/dashboard/etudiant"
        element={
          <RequireRole role="etudiant">
            <EtudiantDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/dashboard/parent"
        element={
          <RequireRole role="parent">
            <ParentDashboard />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App;
