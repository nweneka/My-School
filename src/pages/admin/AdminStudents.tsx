import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import type { RosterStudent, SchoolClass } from '../../types';
import { Link } from 'react-router-dom';

export default function AdminStudents() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { data: students, loading } = useSchoolCollection<RosterStudent>(
    profile?.schoolId,
    'roster_students'
  );
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');

  const [admissionNo, setAdmissionNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [classId, setClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!profile?.schoolId || !admissionNo.trim() || !fullName.trim() || !dateOfBirth || !classId) {
      setError('Tous les champs sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      // Document ID = admission number, so admin can never accidentally
      // create two roster entries with the same admission number —
      // setDoc here would just overwrite, which is a safe failure mode.
      await setDoc(doc(db, 'schools', profile.schoolId, 'roster_students', admissionNo.trim()), {
        admissionNo: admissionNo.trim(),
        fullName: fullName.trim(),
        dateOfBirth,
        classId,
        claimedByUid: null,
      });
      setAdmissionNo('');
      setFullName('');
      setDateOfBirth('');
      setClassId('');
    } finally {
      setSubmitting(false);
    }
  }

  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to="/admin" className="text-white/80 hover:text-white text-sm">
          ← Retour
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">Élèves</h1>
        <Link
          to="/admin/students/import"
          className="text-white/80 hover:text-white text-sm ml-auto"
        >
          Importer (Excel) →
        </Link>
        <Link
          to="/admin/students/generate-accounts"
          className="text-white/80 hover:text-white text-sm ml-4"
        >
          Créer les comptes →
        </Link>
      </header>

      <div className="p-8 max-w-3xl">
        {classes.length === 0 && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            Créez d'abord au moins une classe avant d'ajouter des élèves.{' '}
            <Link to="/admin/classes" className="underline font-medium">
              Aller à Classes
            </Link>
          </div>
        )}

        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5 mb-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              placeholder="N° d'admission"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nom complet"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Classe…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || classes.length === 0}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Ajouter l'élève
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {loading && <p className="p-5 text-sm text-slate-400">Chargement…</p>}
          {!loading && students.length === 0 && (
            <p className="p-5 text-sm text-slate-400">Aucun élève pour le moment.</p>
          )}
          {students.map((s) => (
            <div key={s.admissionNo} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{s.fullName}</p>
                <p className="text-xs text-slate-500">
                  {s.admissionNo} · {classNameById[s.classId] ?? s.classId}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  s.claimedByUid
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.claimedByUid ? 'Compte créé' : 'En attente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
