import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireRole } from './components/RequireRole';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

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
            path="/teacher"
            element={
              <RequireRole allow={['teacher']}>
                <TeacherDashboard />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
