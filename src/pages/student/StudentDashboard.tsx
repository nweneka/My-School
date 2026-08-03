import { where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { LogoutButton } from '../../components/LogoutButton';
import type { ResultEntry, Subject } from '../../types';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();

  const { data: results, loading } = useSchoolCollection<ResultEntry>(
    profile?.schoolId,
    'results',
    profile?.admissionNo
      ? [
          where('studentAdmissionNo', '==', profile.admissionNo),
          where('status', '==', 'published'),
        ]
      : []
  );
  const { data: subjects } = useSchoolCollection<Subject>(profile?.schoolId, 'subjects');
  const subjectNameById = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

  const overallAverage =
    results.length > 0
      ? Math.round((results.reduce((sum, r) => sum + r.average, 0) / results.length) * 100) / 100
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <h1 className="text-white font-semibold text-lg">{school?.name ?? 'My School'}</h1>
        <LogoutButton className="ml-auto" />
      </header>

      <div className="p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Mon espace</h2>
        <p className="text-slate-500 mt-1">Bienvenue, {profile?.displayName}</p>
        <p className="text-sm text-slate-400 mt-0.5">
          N° d'admission : {profile?.admissionNo ?? '—'} · {school?.currentSession} · Trimestre{' '}
          {school?.currentTerm}
        </p>

        <div className="mt-8 max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">Mes résultats</h3>
            {overallAverage !== null && (
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full text-slate-900"
                style={{ backgroundColor: school?.secondaryColor ?? '#e2e8f0' }}
              >
                Moyenne : {overallAverage}/20
              </span>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {loading && <p className="p-5 text-sm text-slate-400">Chargement…</p>}
            {!loading && results.length === 0 && (
              <p className="p-5 text-sm text-slate-400">
                Aucun résultat publié pour le moment. Vos résultats apparaîtront ici dès que
                votre établissement les publiera.
              </p>
            )}
            {results.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <span className="text-sm text-slate-900">
                  {subjectNameById[r.subjectId] ?? r.subjectId}
                </span>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>CA: {r.ca}/20</span>
                  <span>Examen: {r.exam}/20</span>
                  <span className="font-semibold text-slate-900">{r.average}/20</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
