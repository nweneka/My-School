import { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { useTranslation } from '../../lib/i18n';
import type { ResultEntry, RosterStudent, RosterTeacher, SchoolClass, Subject } from '../../types';
import { Link } from 'react-router-dom';

export default function AdminResults() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();
  const { data: results, loading } = useSchoolCollection<ResultEntry>(profile?.schoolId, 'results');
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');
  const { data: subjects } = useSchoolCollection<Subject>(profile?.schoolId, 'subjects');
  const { data: students } = useSchoolCollection<RosterStudent>(profile?.schoolId, 'roster_students');
  const { data: teachers } = useSchoolCollection<RosterTeacher>(profile?.schoolId, 'roster_teachers');
  const [publishing, setPublishing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const subjectNameById = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const studentNameByAdmission = Object.fromEntries(students.map((s) => [s.admissionNo, s.fullName]));
  const teacherNameByStaffId = Object.fromEntries(teachers.map((t) => [t.staffId, t.fullName]));

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
        if (r.status !== 'submitted') continue; // leave drafts and already-published alone
        batch.update(doc(db, 'schools', profile.schoolId, 'results', r.id), {
          status: 'published',
        });
      }
      await batch.commit();
    } finally {
      setPublishing(null);
    }
  }

  async function handlePublishAll() {
    if (!profile?.schoolId) return;
    const toPublish = results.filter((r) => r.status === 'submitted');
    if (toPublish.length === 0) return;
    if (!window.confirm(t('publishAllConfirm'))) return;

    setPublishing('__all__');
    try {
      // Firestore batches cap at 500 writes — chunk for large schools.
      for (let i = 0; i < toPublish.length; i += 450) {
        const chunk = toPublish.slice(i, i + 450);
        const batch = writeBatch(db);
        for (const r of chunk) {
          batch.update(doc(db, 'schools', profile.schoolId, 'results', r.id), {
            status: 'published',
          });
        }
        await batch.commit();
      }
    } finally {
      setPublishing(null);
    }
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
        <h1 className="text-white font-semibold text-lg ml-2">{t('results')}</h1>
      </header>

      <div className="p-8 max-w-3xl">
        {loading && <p className="text-sm text-slate-400">{t('loading')}</p>}
        {!loading && groups.size === 0 && (
          <p className="text-sm text-slate-400">
            {t('noResultsYet')}
          </p>
        )}

        {!loading && results.some((r) => r.status === 'submitted') && (
          <div className="mb-4">
            <button
              onClick={handlePublishAll}
              disabled={publishing === '__all__'}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {publishing === '__all__' ? t('publishing') : t('publishAll')}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {Array.from(groups.entries()).map(([key, entries]) => {
            const first = entries[0];
            const submittedCount = entries.filter((e) => e.status !== 'draft').length;
            const publishedCount = entries.filter((e) => e.status === 'published').length;
            const allPublished = publishedCount === entries.length;
            const hasDrafts = entries.some((e) => e.status === 'draft');
            const isExpanded = expanded === key;
            const teacherName =
              teacherNameByStaffId[first.enteredByStaffId] ?? first.enteredByStaffId;

            return (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : key)}
                    className="text-left flex-1 min-w-[10rem]"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {classNameById[first.classId] ?? first.classId} ·{' '}
                      {subjectNameById[first.subjectId] ?? first.subjectId}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {first.session} · {t('term')} {first.term} · {entries.length} {t('studentsCount')}
                      {hasDrafts && ` · ${t('someInDraft')}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('enteredBy')}: {teacherName}
                    </p>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : key)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                    >
                      {isExpanded ? t('hideDetails') : t('showDetails')}
                    </button>
                    {allPublished ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {t('published')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePublish(key, entries)}
                        disabled={publishing === key || submittedCount === 0}
                        className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                        title={submittedCount === 0 ? t('awaitingSubmission') : undefined}
                      >
                        {publishing === key ? t('publishing') : t('publish')}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400">
                          <th className="pb-2 font-normal">{t('studentInfo')}</th>
                          <th className="pb-2 font-normal text-right">{t('ca')}</th>
                          <th className="pb-2 font-normal text-right">{t('exam')}</th>
                          <th className="pb-2 font-normal text-right">{t('average')}</th>
                          <th className="pb-2 font-normal text-right pl-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((r) => (
                          <tr key={r.id} className="border-t border-slate-50">
                            <td className="py-1.5 text-slate-900">
                              {studentNameByAdmission[r.studentAdmissionNo] ?? r.studentAdmissionNo}
                            </td>
                            <td className="py-1.5 text-right text-slate-600">{r.ca}</td>
                            <td className="py-1.5 text-right text-slate-600">{r.exam}</td>
                            <td className="py-1.5 text-right font-medium text-slate-900">{r.average}</td>
                            <td className="py-1.5 text-right pl-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  r.status === 'published'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : r.status === 'submitted'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {r.status === 'published'
                                  ? t('published')
                                  : r.status === 'submitted'
                                    ? t('statusSubmitted')
                                    : t('statusDraft')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
