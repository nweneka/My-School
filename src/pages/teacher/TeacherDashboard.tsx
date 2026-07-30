import { useAuth } from '../../contexts/AuthContext';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Espace Enseignant</h1>
      <p className="text-slate-500 mt-1">Bienvenue, {profile?.displayName}</p>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Mes classes</h2>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {(profile?.classIds ?? []).length === 0 && (
            <p className="p-5 text-sm text-slate-400">Aucune classe assignée pour le moment.</p>
          )}
          {(profile?.classIds ?? []).map((classId) => (
            <div key={classId} className="p-5 flex items-center justify-between">
              <span className="text-sm text-slate-900">{classId}</span>
              <button className="text-sm font-medium text-slate-900 hover:underline">
                Saisir les notes
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
