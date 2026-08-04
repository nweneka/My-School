import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { computeAverage } from '../../lib/grading';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { useTranslation } from '../../lib/i18n';
import type { RosterStudent, Subject, ResultEntry } from '../../types';

function sessionSlug(session: string) {
  return session.replace(/\//g, '-');
}

function resultDocId(admissionNo: string, subjectId: string, term: number, session: string) {
  return `${admissionNo}__${subjectId}__T${term}__${sessionSlug(session)}`;
}

export default function TeacherResultsEntry() {
  const { classId } = useParams<{ classId: string }>();
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();

  const { data: subjects } = useSchoolCollection<Subject>(profile?.schoolId, 'subjects');
  const { data: students, loading: loadingStudents } = useSchoolCollection<RosterStudent>(
    profile?.schoolId,
    'roster_students',
    classId ? [where('classId', '==', classId)] : []
  );

  const [subjectId, setSubjectId] = useState('');
  const term = school?.currentTerm ?? 1;
  const session = school?.currentSession ?? '';

  const { data: existingResults } = useSchoolCollection<ResultEntry>(
    profile?.schoolId,
    'results',
    subjectId && session
      ? [
          where('classId', '==', classId),
          where('subjectId', '==', subjectId),
          where('term', '==', term),
          where('session', '==', session),
        ]
      : []
  );

  const [scores, setScores] = useState<Record<string, { ca: string; exam: string }>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Pre-fill from whatever's already saved for this subject/term/session.
  useEffect(() => {
    const byAdmission = Object.fromEntries(
      existingResults.map((r) => [r.studentAdmissionNo, r])
    );
    setScores((prev) => {
      const next: Record<string, { ca: string; exam: string }> = {};
      for (const s of students) {
        const existing = byAdmission[s.admissionNo];
        next[s.admissionNo] = prev[s.admissionNo] ?? {
          ca: existing ? String(existing.ca) : '',
          exam: existing ? String(existing.exam) : '',
        };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingResults, students]);

  function updateScore(admissionNo: string, field: 'ca' | 'exam', value: string) {
    setScores((prev) => ({
      ...prev,
      [admissionNo]: { ...prev[admissionNo], [field]: value },
    }));
  }

  const existingStatusByAdmission = Object.fromEntries(
    existingResults.map((r) => [r.studentAdmissionNo, r.status])
  );
  const anyPublished = existingResults.some((r) => r.status === 'published');

  async function saveAll(nextStatus: 'draft' | 'submitted') {
    if (!profile?.schoolId || !classId || !subjectId || !session) return;
    const batch = writeBatch(db);
    for (const s of students) {
      const entry = scores[s.admissionNo];
      if (!entry || entry.ca === '' || entry.exam === '') continue;
      const ca = Number(entry.ca);
      const exam = Number(entry.exam);
      const id = resultDocId(s.admissionNo, subjectId, term, session);
      const ref = doc(db, 'schools', profile.schoolId, 'results', id);
      batch.set(ref, {
        studentAdmissionNo: s.admissionNo,
        classId,
        subjectId,
        session,
        term,
        ca,
        exam,
        average: computeAverage(ca, exam, school),
        enteredByStaffId: profile.staffId ?? profile.uid,
        status: nextStatus,
      });
    }
    return batch.commit();
  }

  async function handleSaveDraft() {
    setMessage(null);
    setSaving(true);
    try {
      await saveAll('draft');
      setMessage(t('draftSaved'));
    } catch {
      setMessage(t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setMessage(null);
    setSubmitting(true);
    try {
      await saveAll('submitted');
      setMessage(t('submittedForReview'));
    } catch {
      setMessage(t('submitError'));
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
        <Link to="/teacher" className="text-white/80 hover:text-white text-sm">
          {t('back')}
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">{t('scoresEntryTitle')}</h1>
      </header>

      <div className="p-8 max-w-3xl">
        <div className="mb-6">
          <label className="text-sm text-slate-600 block mb-1.5">{t('subject')}</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">{t('chooseSubject')}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">
            {session ? `${session} · ${t('term')} ${term}` : t('sessionNotConfigured')}
            {' · '}
            {t('weighting')} : {t('ca')} {school?.caWeight ?? 40}% / {t('exam')} {school?.examWeight ?? 60}%
          </p>
        </div>

        {anyPublished && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            {t('somePublishedWarning')}
          </div>
        )}

        {subjectId && (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {loadingStudents && <p className="p-5 text-sm text-slate-400">{t('loading')}</p>}
            {!loadingStudents && students.length === 0 && (
              <p className="p-5 text-sm text-slate-400">{t('noStudentsInClass')}</p>
            )}
            {students.map((s) => {
              const isPublished = existingStatusByAdmission[s.admissionNo] === 'published';
              return (
                <div key={s.admissionNo} className="p-4 flex items-center gap-4">
                  <span className="flex-1 text-sm text-slate-900">{s.fullName}</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder={`${t('ca')} /20`}
                    value={scores[s.admissionNo]?.ca ?? ''}
                    onChange={(e) => updateScore(s.admissionNo, 'ca', e.target.value)}
                    disabled={isPublished}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
                  />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder={`${t('exam')} /20`}
                    value={scores[s.admissionNo]?.exam ?? ''}
                    onChange={(e) => updateScore(s.admissionNo, 'exam', e.target.value)}
                    disabled={isPublished}
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
                  />
                </div>
              );
            })}
          </div>
        )}

        {subjectId && students.length > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              {saving ? t('saving') : t('saveDraft')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || submitting}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submitToAdmin')}
            </button>
          </div>
        )}

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}
