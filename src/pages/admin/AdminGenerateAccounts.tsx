import { useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import type { RosterStudent } from '../../types';
import { Link } from 'react-router-dom';

// We can't use the app's normal `auth` instance for this — signing up a new
// user with the client SDK automatically signs the browser in as that new
// user, which would kick the admin out of their own session mid-loop. A
// second, throwaway Firebase App instance lets us create accounts without
// touching the admin's active session at all.
function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

type RowResult = { admissionNo: string; status: 'ok' | 'error'; message: string };

export default function AdminGenerateAccounts() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { data: students } = useSchoolCollection<RosterStudent>(
    profile?.schoolId,
    'roster_students'
  );

  const pending = students.filter((s) => !s.claimedByUid);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);

  function emailFor(admissionNo: string) {
    return `${admissionNo.toLowerCase()}@${profile?.schoolId}.myschool`;
  }

  function passwordFor(student: RosterStudent) {
    // Default password = date of birth digits only, e.g. 2010-04-12 -> 20100412.
    // Students/parents should change this after first login (a "change
    // password" flow is worth adding before this goes to a real school).
    return student.dateOfBirth.replace(/-/g, '');
  }

  async function handleGenerate() {
    if (!profile?.schoolId || pending.length === 0) return;
    setRunning(true);
    setResults([]);
    setProgress(0);

    const tempApp = initializeApp(getFirebaseConfig(), `bulk-create-${Date.now()}`);
    const tempAuth = getAuth(tempApp);
    const rows: RowResult[] = [];

    for (let i = 0; i < pending.length; i++) {
      const student = pending[i];
      try {
        const cred = await createUserWithEmailAndPassword(
          tempAuth,
          emailFor(student.admissionNo),
          passwordFor(student)
        );
        await setDoc(doc(db, 'users', cred.user.uid), {
          schoolId: profile.schoolId,
          role: 'student',
          email: emailFor(student.admissionNo),
          displayName: student.fullName,
          status: 'active',
          admissionNo: student.admissionNo,
        });
        await updateDoc(
          doc(db, 'schools', profile.schoolId, 'roster_students', student.admissionNo),
          { claimedByUid: cred.user.uid }
        );
        await tempAuth.signOut();
        rows.push({ admissionNo: student.admissionNo, status: 'ok', message: 'Compte créé' });
      } catch (err) {
        const msg =
          err instanceof Error && err.message.includes('auth/too-many-requests')
            ? 'Limite horaire atteinte (100/heure) — réessayez plus tard'
            : err instanceof Error
              ? err.message
              : 'Erreur inconnue';
        rows.push({ admissionNo: student.admissionNo, status: 'error', message: msg });
      }
      setProgress(i + 1);
      setResults([...rows]);
    }

    await deleteApp(tempApp);
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to="/admin/students" className="text-white/80 hover:text-white text-sm">
          ← Retour
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">Créer les comptes élèves</h1>
      </header>

      <div className="p-8 max-w-2xl">
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{pending.length}</span> élève(s) en attente de
            création de compte sur <span className="font-semibold">{students.length}</span> au
            total.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Identifiant : n° d'admission. Mot de passe par défaut : date de naissance
            (JJMMAAAA sans tirets). Limite : 100 comptes par heure.
          </p>
          <button
            onClick={handleGenerate}
            disabled={running || pending.length === 0}
            className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {running ? `Création… (${progress}/${pending.length})` : 'Créer les comptes'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {results.map((r) => (
              <div key={r.admissionNo} className="p-3 flex items-center justify-between text-sm">
                <span className="text-slate-900">{r.admissionNo}</span>
                <span className={r.status === 'ok' ? 'text-emerald-600' : 'text-red-600'}>
                  {r.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
