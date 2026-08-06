import { where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { LogoutButton } from '../../components/LogoutButton';
import { useTranslation } from '../../lib/i18n';
import type { ResultEntry, Subject } from '../../types';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();

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
        className="px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center gap-2 sm:gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <h1 className="text-white font-semibold text-lg">{school?.name ?? 'My School'}</h1>
        <Link to="/account" className="text-white/80 hover:text-white text-sm ml-auto">
          {t('myAccount')}
        </Link>
        <LogoutButton className="ml-3" />
      </header>

      <div className="p-8">
        <h2 className="text-2xl font-semibold text-slate-900">{t('studentDashboardTitle')}</h2>
        <p className="text-slate-500 mt-1">{t('welcome')}, {profile?.displayName}</p>
        <p className="text-sm text-slate-400 mt-0.5">
          {t('admissionNo')} : {profile?.admissionNo ?? '—'} · {school?.currentSession} · {t('term')}{' '}
          {school?.currentTerm}
        </p>

        <div className="mt-8 max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">{t('myResults')}</h3>
            {overallAverage !== null && (
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full text-slate-900"
                style={{ backgroundColor: school?.secondaryColor ?? '#e2e8f0' }}
              >
                {t('average')} : {overallAverage}/20
              </span>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {loading && <p className="p-5 text-sm text-slate-400">{t('loading')}</p>}
            {!loading && results.length === 0 && (
              <p className="p-5 text-sm text-slate-400">{t('noPublishedResults')}</p>
            )}
            {results.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <span className="text-sm text-slate-900">
                  {subjectNameById[r.subjectId] ?? r.subjectId}
                </span>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{t('ca')}: {r.ca}/20</span>
                  <span>{t('exam')}: {r.exam}/20</span>
                  <span className="font-semibold text-slate-900">{r.average}/20</span>
                </div>
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <Link
              to="/student/bulletin"
              className="inline-block mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium"
            >
              {t('downloadMyBulletin')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
