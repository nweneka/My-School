import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import type { Subject } from '../../types';
import { Link } from 'react-router-dom';

export default function AdminSubjects() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { data: subjects, loading } = useSchoolCollection<Subject>(profile?.schoolId, 'subjects');

  const [name, setName] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.schoolId || !name.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'schools', profile.schoolId, 'subjects'), {
        name: name.trim(),
        coefficient: Number(coefficient) || 1,
      });
      setName('');
      setCoefficient('1');
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-white font-semibold text-lg ml-2">Matières</h1>
      </header>

      <div className="p-8 max-w-2xl">
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5 mb-8 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la matière (ex: Mathématiques)"
            required
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="1"
            value={coefficient}
            onChange={(e) => setCoefficient(e.target.value)}
            placeholder="Coefficient"
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Ajouter
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {loading && <p className="p-5 text-sm text-slate-400">Chargement…</p>}
          {!loading && subjects.length === 0 && (
            <p className="p-5 text-sm text-slate-400">Aucune matière pour le moment.</p>
          )}
          {subjects.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">{s.name}</span>
              <span className="text-xs text-slate-500">Coeff. {s.coefficient}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
