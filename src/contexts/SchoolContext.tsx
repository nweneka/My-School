import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type { School } from '../types';

interface SchoolContextValue {
  school: School | null;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextValue>({ school: null, loading: true });

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.schoolId) {
      setSchool(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'schools', profile.schoolId), (snap) => {
      setSchool(snap.exists() ? ({ id: snap.id, ...snap.data() } as School) : null);
      setLoading(false);
    });
    return unsub;
  }, [profile?.schoolId]);

  // Apply the school's branding as CSS variables the whole app can use,
  // e.g. style={{ color: 'var(--school-primary)' }} or className="text-[var(--school-primary)]"
  useEffect(() => {
    const root = document.documentElement;
    if (school?.primaryColor) root.style.setProperty('--school-primary', school.primaryColor);
    if (school?.secondaryColor) root.style.setProperty('--school-secondary', school.secondaryColor);
  }, [school?.primaryColor, school?.secondaryColor]);

  return (
    <SchoolContext.Provider value={{ school, loading }}>{children}</SchoolContext.Provider>
  );
}

export function useSchool() {
  return useContext(SchoolContext);
}
