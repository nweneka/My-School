import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { translate, type Lang } from '../../lib/i18n';

type SchoolOption = { id: string; name: string };

function useSchoolOptions() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  useEffect(() => {
    getDocs(collection(db, 'schools')).then((snap) => {
      setSchools(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) ?? d.id })));
    });
  }, []);
  return schools;
}

function SchoolSelect({
  value,
  onChange,
  lang,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: Lang;
}) {
  const schools = useSchoolOptions();
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{translate('school', lang)}</label>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
      >
        <option value="">{translate('chooseOption', lang)}</option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function StudentLogin({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!schoolId) {
      setError(translate('chooseSchoolError', lang));
      return;
    }
    setSubmitting(true);
    try {
      const email = `${admissionNo.trim().toLowerCase()}@${schoolId}.myschool`;
      const password = dateOfBirth.replace(/-/g, '');
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch {
      setError(translate('studentLoginError', lang));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SchoolSelect value={schoolId} onChange={setSchoolId} lang={lang} />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{translate('admissionNo', lang)}</label>
        <input
          required
          value={admissionNo}
          onChange={(e) => setAdmissionNo(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{translate('dateOfBirth', lang)}</label>
        <input
          type="date"
          required
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? translate('signingIn', lang) : translate('signIn', lang)}
      </button>
    </form>
  );
}

function ForgotPassword({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatus('sent');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{translate('resetPasswordInstructions', lang)}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {status === 'sent' && (
          <p className="text-sm text-emerald-600">{translate('resetLinkSent', lang)}</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600">{translate('resetLinkError', lang)}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? translate('sending', lang) : translate('sendResetLink', lang)}
        </button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-slate-700 underline"
      >
        {translate('backToLogin', lang)}
      </button>
    </div>
  );
}

function StaffLogin({ lang }: { lang: Lang }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch {
      setError(translate('staffLoginError', lang));
    } finally {
      setSubmitting(false);
    }
  }

  if (showForgot) {
    return <ForgotPassword lang={lang} onBack={() => setShowForgot(false)} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">{translate('password', lang)}</label>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            {translate('forgotPassword', lang)}
          </button>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? translate('signingIn', lang) : translate('signIn', lang)}
      </button>
    </form>
  );
}

export default function Login() {
  const [tab, setTab] = useState<'student' | 'staff'>('student');
  const [lang, setLang] = useState<Lang>('fr');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
        <div className="flex justify-end">
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                lang === 'fr' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                lang === 'en' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="text-center space-y-1 -mt-4">
          <h1 className="text-2xl font-semibold text-slate-900">{translate('loginTitle', lang)}</h1>
          <p className="text-sm text-slate-500">{translate('loginSubtitle', lang)}</p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab('student')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'student' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            {translate('tabStudent', lang)}
          </button>
          <button
            type="button"
            onClick={() => setTab('staff')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'staff' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            {translate('tabStaff', lang)}
          </button>
        </div>

        {tab === 'student' ? <StudentLogin lang={lang} /> : <StaffLogin lang={lang} />}
      </div>
    </div>
  );
}
