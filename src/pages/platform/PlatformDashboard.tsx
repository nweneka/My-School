import { useEffect, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getSubscriptionState } from '../../lib/subscription';
import type { School } from '../../types';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export default function PlatformDashboard() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  async function loadSchools() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'schools'));
    setSchools(snap.docs.map((d) => ({ id: d.id, ...d.data() } as School)));
    setLoading(false);
  }

  useEffect(() => {
    loadSchools();
  }, []);

  async function handleActivate(schoolId: string) {
    setActivating(schoolId);
    try {
      const now = Date.now();
      await updateDoc(doc(db, 'schools', schoolId), {
        plan: 'active',
        subscriptionStart: now,
        subscriptionEndsAt: now + YEAR_MS,
      });
      await loadSchools();
    } finally {
      setActivating(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-4 sm:px-8 py-4 sm:py-5 bg-slate-900">
        <h1 className="text-white font-semibold text-lg">Tableau de bord — Plateforme</h1>
      </header>

      <div className="p-8 max-w-4xl">
        {loading && <p className="text-sm text-slate-400">Chargement…</p>}
        {!loading && schools.length === 0 && (
          <p className="text-sm text-slate-400">Aucune école pour le moment.</p>
        )}

        <div className="space-y-3">
          {schools.map((school) => {
            const sub = getSubscriptionState(school);
            const statusLabel =
              sub.status === 'active'
                ? 'Actif'
                : sub.status === 'trial'
                  ? 'Essai'
                  : sub.status === 'expired'
                    ? 'Expiré'
                    : '—';
            const statusColor =
              sub.status === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : sub.status === 'trial'
                  ? 'bg-blue-50 text-blue-700'
                  : sub.status === 'expired'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-slate-100 text-slate-500';

            return (
              <div
                key={school.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{school.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {school.id}
                    {sub.daysLeft !== null && sub.status !== 'expired' && (
                      <> · {sub.daysLeft} jours restants</>
                    )}
                    {school.subscriptionEndsAt && (
                      <> · Expire le {new Date(school.subscriptionEndsAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                    {statusLabel}
                  </span>
                  {sub.status !== 'active' && (
                    <button
                      onClick={() => handleActivate(school.id)}
                      disabled={activating === school.id}
                      className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      {activating === school.id ? 'Activation…' : "Activer l'abonnement (1 an)"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
