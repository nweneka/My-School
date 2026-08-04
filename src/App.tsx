import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolProvider } from './contexts/SchoolContext';
import { RequireRole } from './components/RequireRole';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClasses from './pages/admin/AdminClasses';
import AdminStudents from './pages/admin/AdminStudents';
import AdminStudentsImport from './pages/admin/AdminStudentsImport';
import AdminGenerateAccounts from './pages/admin/AdminGenerateAccounts';
import AdminGenerateTeacherAccounts from './pages/admin/AdminGenerateTeacherAccounts';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminSettings from './pages/admin/AdminSettings';
import AdminResults from './pages/admin/AdminResults';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherResultsEntry from './pages/teacher/TeacherResultsEntry';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentBulletin from './pages/student/StudentBulletin';
import MyAccount from './pages/account/MyAccount';

function Home() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Chargement…</div>;
  if (!profile) return <Navigate to="/login" replace />;

  switch (profile.role) {
    case 'admin':
    case 'superadmin':
      return <Navigate to="/admin" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SchoolProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route
              path="/admin"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminClasses />
                </RequireRole>
              }
            />
            <Route
              path="/admin/students"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminStudents />
                </RequireRole>
              }
            />
            <Route
              path="/admin/students/import"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminStudentsImport />
                </RequireRole>
              }
            />
            <Route
              path="/admin/students/generate-accounts"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminGenerateAccounts />
                </RequireRole>
              }
            />
            <Route
              path="/admin/teachers/generate-accounts"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminGenerateTeacherAccounts />
                </RequireRole>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminTeachers />
                </RequireRole>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminSubjects />
                </RequireRole>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminSettings />
                </RequireRole>
              }
            />
            <Route
              path="/admin/results"
              element={
                <RequireRole allow={['admin', 'superadmin']}>
                  <AdminResults />
                </RequireRole>
              }
            />
            <Route
              path="/teacher"
              element={
                <RequireRole allow={['teacher']}>
                  <TeacherDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/teacher/results/:classId"
              element={
                <RequireRole allow={['teacher']}>
                  <TeacherResultsEntry />
                </RequireRole>
              }
            />
            <Route
              path="/student"
              element={
                <RequireRole allow={['student']}>
                  <StudentDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/student/bulletin"
              element={
                <RequireRole allow={['student']}>
                  <StudentBulletin />
                </RequireRole>
              }
            />
            <Route
              path="/account"
              element={
                <RequireRole allow={['admin', 'superadmin', 'teacher', 'student']}>
                  <MyAccount />
                </RequireRole>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SchoolProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
