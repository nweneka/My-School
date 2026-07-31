import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';

type SchoolOption = { id: string; name: string };

function StudentLogin() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'schools')).then((snap) => {
      setSchools(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) ?? d.id })));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!schoolId) {
      setError('Choisissez votre école.');
      return;
    }
    setSubmitting(true);
    try {
      const email = `${admissionNo.trim().toLowerCase()}@${schoolId}.myschool`;
      const password = dateOfBirth.replace(/-/g, '');
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch {
      setError("Identifiants incorrects. Vérifiez l'école, le numéro d'admission et la date de naissance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">École</label>
        <select
          required
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Choisir…</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">N° d'admission</label>
        <input
          required
          value={admissionNo}
          onChange={(e) => setAdmissionNo(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Date de naissance</label>
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
        {submitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}

function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch {
      setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Mot de passe</label>
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
        {submitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}

export default function Login() {
  const [tab, setTab] = useState<'student' | 'staff'>('student');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">My School</h1>
          <p className="text-sm text-slate-500">Connectez-vous à votre espace</p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab('student')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'student' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            Élève
          </button>
          <button
            type="button"
            onClick={() => setTab('staff')}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              tab === 'staff' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            Administration / Enseignant
          </button>
        </div>

        {tab === 'student' ? <StudentLogin /> : <StaffLogin />}
      </div>
    </div>
  );
}
