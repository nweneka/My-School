import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useTranslation, type Lang } from '../../lib/i18n';
import { COLOR_THEMES } from '../../lib/themePresets';
import { Link } from 'react-router-dom';

export default function AdminSettings() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();

  const [name, setName] = useState(school?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(school?.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(school?.primaryColor ?? '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(school?.secondaryColor ?? '#e2e8f0');
  const [language, setLanguage] = useState<Lang>(school?.language ?? 'fr');
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
      setLanguage(school.language ?? 'fr');
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
        language,
      });
      // Keep the public directory entry (used by the login page picker)
      // in sync — it only holds the name, but that still needs updating
      // whenever the school renames itself.
      await updateDoc(doc(db, 'school_directory', profile.schoolId), {
        name: name.trim(),
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
        className="px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center gap-2 sm:gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to="/admin" className="text-white/80 hover:text-white text-sm">
          {t('back')}
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">{t('schoolSettingsTitle')}</h1>
      </header>

      <div className="p-8 max-w-lg space-y-8">
        <form onSubmit={handleSaveDetails} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-700">{t('schoolIdentity')}</h2>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xs text-slate-400">{t('none')}</span>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm text-slate-600">{t('logoUrlLabel')}</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">
            {t('logoHostNote')}
          </p>
          {logoUrl && !/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(logoUrl) && (
            <p className="text-xs text-amber-600 -mt-2">{t('logoUrlWarning')}</p>
          )}

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600">{t('schoolNameLabel')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600">{t('chooseColorTheme')}</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_THEMES.map((theme) => (
                <button
                  type="button"
                  key={theme.name}
                  title={theme.name}
                  onClick={() => {
                    setPrimaryColor(theme.primaryColor);
                    setSecondaryColor(theme.secondaryColor);
                  }}
                  className="h-10 rounded-lg border-2 border-transparent hover:border-slate-300 flex overflow-hidden"
                >
                  <span className="w-1/2 h-full" style={{ backgroundColor: theme.primaryColor }} />
                  <span className="w-1/2 h-full" style={{ backgroundColor: theme.secondaryColor }} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">{t('primaryColorLabel')}</label>
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
              <label className="text-sm text-slate-600">{t('secondaryColorLabel')}</label>
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

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600">{t('appLanguageLabel')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Lang)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={savingDetails}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {savingDetails ? t('saving') : t('save')}
          </button>
        </form>

        <form onSubmit={handleSaveWeights} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-slate-700">{t('gradeWeightingTitle')}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('gradeWeightingNote')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset(40, 60)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              {t('nigerianPreset')}
            </button>
            <button
              type="button"
              onClick={() => applyPreset(33, 67)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              {t('francophonePreset')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">{t('ca')} (%)</label>
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
              <label className="text-sm text-slate-600">{t('exam')} (%)</label>
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
              {t('weightSumError')} {caWeight + examWeight}).
            </p>
          )}

          <button
            type="submit"
            disabled={savingWeights || weightError}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {savingWeights ? t('saving') : t('saveWeighting')}
          </button>
        </form>
      </div>
    </div>
  );
}
