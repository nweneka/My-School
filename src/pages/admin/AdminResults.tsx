import { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import type { ResultEntry, SchoolClass, Subject } from '../../types';
import { Link } from 'react-router-dom';

export default function AdminResults() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { data: results, loading } = useSchoolCollection<ResultEntry>(profile?.schoolId, 'results');
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');
  const { data: subjects } = useSchoolCollection<Subject>(profile?.schoolId, 'subjects');
  const [publishing, setPublishing] = useState<string | null>(null);

  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const subjectNameById = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

  // Group results by class + subject + term + session so the admin
  // publishes a whole batch at once, not one student at a time.
  const groups = new Map<string, ResultEntry[]>();
  for (const r of results) {
    const key = `${r.classId}__${r.subjectId}__${r.term}__${r.session}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  async function handlePublish(groupKey: string, entries: ResultEntry[]) {
    if (!profile?.schoolId) return;
    setPublishing(groupKey);
    try {
      const batch = writeBatch(db);
      for (const r of entries) {
        if (r.status === 'published') continue;
        batch.update(doc(db, 'schools', profile.schoolId, 'results', r.id), {
          status: 'published',
        });
      }
      await batch.commit();
    } finally {
      setPublishing(null);
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
        <h1 className="text-white font-semibold text-lg ml-2">Résultats</h1>
      </header>

      <div className="p-8 max-w-3xl">
        {loading && <p className="text-sm text-slate-400">Chargement…</p>}
        {!loading && groups.size === 0 && (
          <p className="text-sm text-slate-400">
            Aucune note saisie pour le moment. Les enseignants doivent d'abord soumettre leurs notes.
          </p>
        )}

        <div className="space-y-4">
          {Array.from(groups.entries()).map(([key, entries]) => {
            const first = entries[0];
            const submittedCount = entries.filter((e) => e.status !== 'draft').length;
            const publishedCount = entries.filter((e) => e.status === 'published').length;
            const allPublished = publishedCount === entries.length;
            const hasDrafts = entries.some((e) => e.status === 'draft');

            return (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {classNameById[first.classId] ?? first.classId} ·{' '}
                      {subjectNameById[first.subjectId] ?? first.subjectId}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {first.session} · Trimestre {first.term} · {entries.length} élève(s)
                      {hasDrafts && ' · certains en brouillon'}
                    </p>
                  </div>

                  {allPublished ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      Publié
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePublish(key, entries)}
                      disabled={publishing === key || submittedCount === 0}
                      className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                      title={submittedCount === 0 ? "En attente de soumission par l'enseignant" : undefined}
                    >
                      {publishing === key ? 'Publication…' : 'Publier'}
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
