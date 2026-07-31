import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import type { SchoolClass } from '../../types';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');
  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <h1 className="text-white font-semibold text-lg">{school?.name ?? 'My School'}</h1>
      </header>

      <div className="p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Espace Enseignant</h2>
        <p className="text-slate-500 mt-1">Bienvenue, {profile?.displayName}</p>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Mes classes</h3>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {(profile?.classIds ?? []).length === 0 && (
              <p className="p-5 text-sm text-slate-400">Aucune classe assignée pour le moment.</p>
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
                  Saisir les notes
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
