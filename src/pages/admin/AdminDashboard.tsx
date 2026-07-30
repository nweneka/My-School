import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord — Admin</h1>
      <p className="text-slate-500 mt-1">Bienvenue, {profile?.displayName}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {['Élèves', 'Enseignants', 'Classes', 'Résultats'].map((label) => (
          <div key={label} className="rounded-xl border border-slate-200 p-5 bg-white">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
