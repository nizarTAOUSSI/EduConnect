
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Ecosystem from './components/Ecosystem';
import Guarantees from './components/Guarantees';
import Footer from './components/Footer';
import RoleDashboard from './dashboards/RoleDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import EnseignantDashboard from './dashboards/EnseignantDashboard';
import EtudiantDashboard from './dashboards/EtudiantDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import RequireAuth from './routes/RequireAuth';
import RequireRole from './routes/RequireRole';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './dashboards/admin/AdminLayout';
import UsersManager from './dashboards/admin/UsersManager';
import ClassesManager from './dashboards/admin/ClassesManager';
import MatieresManager from './dashboards/admin/MatieresManager';

function App() {
  return (
    <>
      <Toaster position="top-right" />
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
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersManager />} />
        <Route path="classes" element={<ClassesManager />} />
        <Route path="matieres" element={<MatieresManager />} />
      </Route>
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
    </>
  )
}

export default App;
