import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { profile } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Mon espace</h1>
      <p className="text-slate-500 mt-1">Bienvenue, {profile?.displayName}</p>
      <p className="text-sm text-slate-400 mt-0.5">
        N° d'admission : {profile?.admissionNo ?? '—'}
      </p>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Mes résultats</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-400">
            Aucun résultat publié pour le moment. Vos résultats apparaîtront ici dès
            que votre établissement les publiera.
          </p>
        </div>
      </div>
    </div>
  );
}
