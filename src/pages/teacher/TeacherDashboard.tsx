import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { LogoutButton } from '../../components/LogoutButton';
import { useTranslation } from '../../lib/i18n';
import type { SchoolClass } from '../../types';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');
  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <h1 className="text-white font-semibold text-lg">{school?.name ?? 'My School'}</h1>
        <Link to="/account" className="text-white/80 hover:text-white text-sm ml-auto">
          {t('myAccount')}
        </Link>
        <LogoutButton className="ml-3" />
      </header>

      <div className="p-8">
        <h2 className="text-2xl font-semibold text-slate-900">{t('teacherDashboardTitle')}</h2>
        <p className="text-slate-500 mt-1">{t('welcome')}, {profile?.displayName}</p>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-slate-700 mb-3">{t('myClasses')}</h3>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {(profile?.classIds ?? []).length === 0 && (
              <p className="p-5 text-sm text-slate-400">{t('noClassesAssigned')}</p>
            )}
            {(profile?.classIds ?? []).map((classId) => (
              <div key={classId} className="p-5 flex items-center justify-between">
                <span className="text-sm text-slate-900">
                  {classNameById[classId] ?? classId}
                </span>
                <Link
                  to={`/teacher/results/${classId}`}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  {t('enterScores')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
