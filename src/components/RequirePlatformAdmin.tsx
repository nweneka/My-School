import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function RequirePlatformAdmin({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      setIsPlatformAdmin(false);
      return;
    }
    getDoc(doc(db, 'platform_admins', firebaseUser.uid)).then((snap) => {
      setIsPlatformAdmin(snap.exists());
    });
  }, [firebaseUser, authLoading]);

  if (authLoading || isPlatformAdmin === null) {
    return <div className="p-8 text-center text-slate-500">Chargement…</div>;
  }
  if (!firebaseUser || !isPlatformAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
