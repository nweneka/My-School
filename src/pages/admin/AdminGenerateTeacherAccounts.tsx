import { useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { useTranslation } from '../../lib/i18n';
import type { RosterTeacher } from '../../types';
import { Link } from 'react-router-dom';

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

type RowResult = { staffId: string; status: 'ok' | 'error'; message: string };

export default function AdminGenerateTeacherAccounts() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();
  const { data: teachers } = useSchoolCollection<RosterTeacher>(
    profile?.schoolId,
    'roster_teachers'
  );

  const pending = teachers.filter((teacher) => !teacher.claimedByUid);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);

  function emailFor(staffId: string) {
    return `${staffId.toLowerCase()}@${profile?.schoolId}.myschool`;
  }

  // Teachers have no date of birth on file (we don't collect it for staff),
  // so the default password is their own staff ID — same idea as students'
  // birthdate default: predictable, and they're expected to change it.
  function passwordFor(teacher: RosterTeacher) {
    return `ens-${teacher.staffId}`;
  }

  async function handleGenerate() {
    if (!profile?.schoolId || pending.length === 0) return;
    setRunning(true);
    setResults([]);
    setProgress(0);

    const tempApp = initializeApp(getFirebaseConfig(), `bulk-create-t-${Date.now()}`);
    const tempAuth = getAuth(tempApp);
    const rows: RowResult[] = [];

    for (let i = 0; i < pending.length; i++) {
      const teacher = pending[i];
      try {
        const cred = await createUserWithEmailAndPassword(
          tempAuth,
          emailFor(teacher.staffId),
          passwordFor(teacher)
        );
        await setDoc(doc(db, 'users', cred.user.uid), {
          schoolId: profile.schoolId,
          role: 'teacher',
          email: emailFor(teacher.staffId),
          displayName: teacher.fullName,
          status: 'active',
          staffId: teacher.staffId,
          classIds: teacher.classIds,
        });
        await updateDoc(
          doc(db, 'schools', profile.schoolId, 'roster_teachers', teacher.staffId),
          { claimedByUid: cred.user.uid }
        );
        await tempAuth.signOut();
        rows.push({ staffId: teacher.staffId, status: 'ok', message: t('accountCreated') });
      } catch (err) {
        const msg =
          err instanceof Error && err.message.includes('auth/too-many-requests')
            ? t('hourlyLimitReached')
            : err instanceof Error
              ? err.message
              : t('unknownError');
        rows.push({ staffId: teacher.staffId, status: 'error', message: msg });
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
        className="px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center gap-2 sm:gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to="/admin/teachers" className="text-white/80 hover:text-white text-sm">
          {t('back')}
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">{t('createTeacherAccounts')}</h1>
      </header>

      <div className="p-8 max-w-2xl">
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{pending.length}</span> {t('teachers').toLowerCase()} {t('outOf')}{' '}
            <span className="font-semibold">{teachers.length}</span> {t('totalLabel')}.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {t('teacherAccountRules')}
          </p>
          <button
            onClick={handleGenerate}
            disabled={running || pending.length === 0}
            className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {running ? `${t('creatingProgress')} (${progress}/${pending.length})` : t('createAccountsButton')}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {results.map((r) => (
              <div key={r.staffId} className="p-3 flex items-center justify-between text-sm">
                <span className="text-slate-900">{r.staffId}</span>
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
