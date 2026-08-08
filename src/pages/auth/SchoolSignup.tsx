import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { translate, type Lang } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { COLOR_THEMES } from '../../lib/themePresets';

const TRIAL_DAYS = 30;

function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export default function SchoolSignup() {
  const navigate = useNavigate();
  const { firebaseUser, profile, loading } = useAuth();
  const [lang, setLang] = useState<Lang>('fr');

  useEffect(() => {
    if (!loading && firebaseUser && profile) {
      navigate('/', { replace: true });
    }
  }, [loading, firebaseUser, profile, navigate]);

  const [schoolName, setSchoolName] = useState('');
  const [yourName, setYourName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [themeIndex, setThemeIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let schoolId = slugify(schoolName);
      if (!schoolId) schoolId = 'ecole';

      // Firebase Auth account first — this is what makes us "signed in"
      // for the subsequent Firestore writes to even be allowed.
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const now = Date.now();
      const theme = COLOR_THEMES[themeIndex];

      try {
        // Step 1: create the school itself. Firestore's create semantics
        // only allow this if no document exists at this ID yet — if the
        // slug is taken, this throws and we ask for a different name
        // rather than silently attaching to someone else's school.
        await setDoc(doc(db, 'schools', schoolId), {
          name: schoolName.trim(),
          logoUrl: '',
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          language: lang,
          currentSession: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          currentTerm: 1,
          plan: 'trial',
          caWeight: 40,
          examWeight: 60,
          createdBy: uid,
          createdAt: now,
          trialEndsAt: now + TRIAL_DAYS * 24 * 60 * 60 * 1000,
        });

        // Step 2: create the founding admin profile, now that the school
        // doc (with createdBy matching us) exists for the rule to check.
        await setDoc(doc(db, 'users', uid), {
          schoolId,
          role: 'admin',
          email,
          displayName: yourName.trim(),
          status: 'active',
        });

        // Public directory entry — just the name, used by the login page's
        // school picker. The rule for this requires the schools/{schoolId}
        // doc (created above) to already exist with createdBy == us, so
        // this write must come after it, not before or in parallel.
        await setDoc(doc(db, 'school_directory', schoolId), {
          name: schoolName.trim(),
        });
        // Don't navigate here — same fix as Login: wait for AuthContext
        // to actually confirm the session + profile via the effect above.
      } catch (innerErr) {
        // The Auth account was created but the school/profile write
        // failed (e.g. name collision). Don't leave a broken half-account
        // — surface a clear error so they can pick a different name and
        // retry (retrying re-authenticates the same way and continues).
        throw innerErr;
      }
    } catch (err) {
      const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'auth/email-already-in-use') {
        setError(translate('emailAlreadyInUseSignup', lang));
      } else if (code === 'permission-denied' || (err instanceof Error && err.message.includes('PERMISSION_DENIED'))) {
        setError(translate('schoolNameTaken', lang));
      } else {
        setError(translate('signupGenericError', lang));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
        <div className="flex justify-end">
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`px-2.5 py-1 rounded-md font-medium ${lang === 'fr' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md font-medium ${lang === 'en' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="text-center space-y-1 -mt-4">
          <h1 className="text-2xl font-semibold text-slate-900">{translate('createSchoolTitle', lang)}</h1>
          <p className="text-sm text-slate-500">{translate('trialNotice', lang)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{translate('schoolNameField', lang)}</label>
            <input
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{translate('yourNameField', lang)}</label>
            <input
              required
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{translate('email', lang)}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{translate('password', lang)}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{translate('chooseColorTheme', lang)}</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_THEMES.map((theme, i) => (
                <button
                  type="button"
                  key={theme.name}
                  onClick={() => setThemeIndex(i)}
                  title={theme.name}
                  className={`h-12 rounded-lg border-2 flex overflow-hidden ${
                    themeIndex === i ? 'border-slate-900' : 'border-transparent'
                  }`}
                >
                  <span className="w-1/2 h-full" style={{ backgroundColor: theme.primaryColor }} />
                  <span className="w-1/2 h-full" style={{ backgroundColor: theme.secondaryColor }} />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">{COLOR_THEMES[themeIndex].name}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? translate('creatingAccount', lang) : translate('createAccount', lang)}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {translate('alreadyHaveAccount', lang)}{' '}
          <Link to="/login" className="text-slate-900 font-medium underline">
            {translate('backToLoginLink', lang)}
          </Link>
        </p>
      </div>
    </div>
  );
}
