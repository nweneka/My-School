import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement…</div>;
  if (!firebaseUser || !profile) return <Navigate to="/login" replace />;
  if (!allow.includes(profile.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
