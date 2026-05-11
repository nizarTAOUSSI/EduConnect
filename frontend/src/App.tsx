
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
import TeachersManager from './dashboards/admin/TeachersManager';
import StudentsManager from './dashboards/admin/StudentsManager';
import ParentsManager from './dashboards/admin/ParentsManager';
import SallesManager from './dashboards/admin/SallesManager';
import TimetableManager from './dashboards/admin/TimetableManager';
import EvaluationsManager from './dashboards/admin/EvaluationsManager';
import Notifications from './components/Notifications';

// Teacher Dashboards
import TeacherLayout from './dashboards/teacher/TeacherLayout';
import TeacherClasses from './dashboards/teacher/TeacherClasses';
import TeacherNotes from './dashboards/teacher/TeacherNotes';
import TeacherAbsences from './dashboards/teacher/TeacherAbsences';
import TeacherReclamations from './dashboards/teacher/TeacherReclamations';
import TeacherTimetable from './dashboards/teacher/TeacherTimetable';

// Student Dashboards
import StudentLayout from './dashboards/student/StudentLayout';
import StudentNotes from './dashboards/student/StudentNotes';
import StudentAbsences from './dashboards/student/StudentAbsences';
import StudentReclamations from './dashboards/student/StudentReclamations';
import StudentTimetable from './dashboards/student/StudentTimetable';

// Parent Dashboards
import ParentLayout from './dashboards/parent/ParentLayout';
import ParentChildren from './dashboards/parent/ParentChildren';
import ParentNotes from './dashboards/parent/ParentNotes';
import ParentAbsences from './dashboards/parent/ParentAbsences';
import ParentReclamations from './dashboards/parent/ParentReclamations';
import ParentTimetable from './dashboards/parent/ParentTimetable';
import PeriodesManager from './dashboards/admin/PeriodesManager';

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
        <Route path="teachers" element={<TeachersManager />} />
        <Route path="students" element={<StudentsManager />} />
        <Route path="parents" element={<ParentsManager />} />
        <Route path="salles" element={<SallesManager />} />
        <Route path="periodes" element={<PeriodesManager />} />
        <Route path="timetable" element={<TimetableManager />} />
        <Route path="evaluations" element={<EvaluationsManager />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route
        path="/dashboard/enseignant"
        element={
          <RequireRole role="enseignant">
            <TeacherLayout />
          </RequireRole>
        }
      >
        <Route index element={<EnseignantDashboard />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="notes" element={<TeacherNotes />} />
        <Route path="absences" element={<TeacherAbsences />} />
        <Route path="reclamations" element={<TeacherReclamations />} />
        <Route path="timetable" element={<TeacherTimetable />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="/dashboard/etudiant"
        element={
          <RequireRole role="etudiant">
            <StudentLayout />
          </RequireRole>
        }
      >
        <Route index element={<EtudiantDashboard />} />
        <Route path="notes" element={<StudentNotes />} />
        <Route path="absences" element={<StudentAbsences />} />
        <Route path="reclamations" element={<StudentReclamations />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="/dashboard/parent"
        element={
          <RequireRole role="parent">
            <ParentLayout />
          </RequireRole>
        }
      >
        <Route index element={<ParentDashboard />} />
        <Route path="enfants" element={<ParentChildren />} />
        <Route path="notes" element={<ParentNotes />} />
        <Route path="absences" element={<ParentAbsences />} />
        <Route path="reclamations" element={<ParentReclamations />} />
        <Route path="timetable" element={<ParentTimetable />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default App;
