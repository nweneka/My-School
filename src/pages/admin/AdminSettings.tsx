import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { Link } from 'react-router-dom';

export default function AdminSettings() {
  const { profile } = useAuth();
  const { school } = useSchool();

  const [name, setName] = useState(school?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(school?.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(school?.primaryColor ?? '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(school?.secondaryColor ?? '#e2e8f0');
  const [savingDetails, setSavingDetails] = useState(false);

  const [caWeight, setCaWeight] = useState(school?.caWeight ?? 40);
  const [examWeight, setExamWeight] = useState(school?.examWeight ?? 60);
  const [savingWeights, setSavingWeights] = useState(false);
  const weightError = caWeight + examWeight !== 100;

  useEffect(() => {
    if (school) {
      setName(school.name ?? '');
      setLogoUrl(school.logoUrl ?? '');
      setPrimaryColor(school.primaryColor ?? '#0f172a');
      setSecondaryColor(school.secondaryColor ?? '#e2e8f0');
      setCaWeight(school.caWeight ?? 40);
      setExamWeight(school.examWeight ?? 60);
    }
  }, [school]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.schoolId) return;
    setSavingDetails(true);
    try {
      await updateDoc(doc(db, 'schools', profile.schoolId), {
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        primaryColor,
        secondaryColor,
      });
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSaveWeights(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.schoolId || weightError) return;
    setSavingWeights(true);
    try {
      await updateDoc(doc(db, 'schools', profile.schoolId), { caWeight, examWeight });
    } finally {
      setSavingWeights(false);
    }
  }

  function applyPreset(ca: number, exam: number) {
    setCaWeight(ca);
    setExamWeight(exam);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to="/admin" className="text-white/80 hover:text-white text-sm">
          ← Retour
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">Paramètres de l'école</h1>
      </header>

      <div className="p-8 max-w-lg space-y-8">
        <form onSubmit={handleSaveDetails} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-700">Identité de l'école</h2>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">Aucun</span>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm text-slate-600">URL du logo</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">
            Hébergez le logo (ex: imgbb.com) puis collez le lien ici.
          </p>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600">Nom de l'école</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">Couleur principale</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-9 rounded border border-slate-300"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">Couleur secondaire</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-9 rounded border border-slate-300"
                />
                <input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingDetails}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {savingDetails ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>

        <form onSubmit={handleSaveWeights} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-slate-700">Pondération des notes</h2>
            <p className="text-xs text-slate-500 mt-1">
              Détermine comment la moyenne d'un élève est calculée à partir du CA
              (contrôle continu) et de l'examen. Les deux valeurs doivent totaliser 100.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset(40, 60)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Nigérian (40 / 60)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(33, 67)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Francophone (33 / 67)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">CA (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={caWeight}
                onChange={(e) => setCaWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">Examen (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={examWeight}
                onChange={(e) => setExamWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {weightError && (
            <p className="text-sm text-red-600">
              CA + Examen doit être égal à 100 (actuellement {caWeight + examWeight}).
            </p>
          )}

          <button
            type="submit"
            disabled={savingWeights || weightError}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {savingWeights ? 'Enregistrement…' : 'Enregistrer la pondération'}
          </button>
        </form>
      </div>
    </div>
  );
}
