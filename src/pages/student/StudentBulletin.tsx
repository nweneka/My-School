import { where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { useTranslation } from '../../lib/i18n';
import type { ResultEntry, Subject } from '../../types';

export default function StudentBulletin() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();

  const { data: results } = useSchoolCollection<ResultEntry>(
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

  const today = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden px-6 py-4 flex items-center gap-3 bg-white border-b border-slate-200">
        <Link to="/student" className="text-slate-600 hover:text-slate-900 text-sm">
          {t('back')}
        </Link>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium"
        >
          {t('printOrSavePdf')}
        </button>
      </div>

      {/* The actual bulletin — this is what prints */}
      <div className="max-w-2xl mx-auto bg-white my-8 p-10 shadow-sm print:shadow-none print:my-0">
        <div
          className="flex items-center gap-4 pb-6 border-b-4"
          style={{ borderColor: school?.primaryColor ?? '#0f172a' }}
        >
          {school?.logoUrl && (
            <img src={school.logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{school?.name ?? 'My School'}</h1>
            <p className="text-sm text-slate-500">{t('bulletinPageTitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 py-6 text-sm">
          <div>
            <span className="text-slate-500">{t('studentInfo')}:</span>{' '}
            <span className="font-medium text-slate-900">{profile?.displayName}</span>
          </div>
          <div>
            <span className="text-slate-500">{t('admissionNo')}:</span>{' '}
            <span className="font-medium text-slate-900">{profile?.admissionNo}</span>
          </div>
          <div>
            <span className="text-slate-500">{t('term')}:</span>{' '}
            <span className="font-medium text-slate-900">
              {school?.currentSession} · {t('term')} {school?.currentTerm}
            </span>
          </div>
          <div>
            <span className="text-slate-500">{t('generatedOn')}:</span>{' '}
            <span className="font-medium text-slate-900">{today}</span>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-600">
              <th className="py-2">{t('subject')}</th>
              <th className="py-2 text-right">{t('ca')} /20</th>
              <th className="py-2 text-right">{t('exam')} /20</th>
              <th className="py-2 text-right">{t('average')} /20</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-2 text-slate-900">{subjectNameById[r.subjectId] ?? r.subjectId}</td>
                <td className="py-2 text-right text-slate-600">{r.ca}</td>
                <td className="py-2 text-right text-slate-600">{r.exam}</td>
                <td className="py-2 text-right font-medium text-slate-900">{r.average}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {overallAverage !== null && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-slate-300">
            <span className="font-semibold text-slate-900">{t('overallAverageLabel')}</span>
            <span
              className="font-bold text-lg px-3 py-1 rounded-full text-slate-900"
              style={{ backgroundColor: school?.secondaryColor ?? '#e2e8f0' }}
            >
              {overallAverage}/20
            </span>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-10 pt-4 border-t border-slate-100">
          {t('officialDocumentNote')} {school?.name} — My School
        </p>
      </div>
    </div>
  );
}
