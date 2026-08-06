import { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { useTranslation } from '../../lib/i18n';
import type { RosterTeacher, SchoolClass, Subject } from '../../types';
import { Link } from 'react-router-dom';

function TagToggle({
  options,
  selected,
  onToggle,
  emptyLabel,
}: {
  options: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.length === 0 && <span className="text-xs text-slate-400">{emptyLabel}</span>}
      {options.map((o) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onToggle(o.id)}
          className={`text-xs px-3 py-1.5 rounded-full border ${
            selected.includes(o.id)
              ? 'bg-slate-900 text-white border-slate-900'
              : 'border-slate-300 text-slate-600'
          }`}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

export default function AdminTeachers() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();
  const { data: teachers, loading } = useSchoolCollection<RosterTeacher>(
    profile?.schoolId,
    'roster_teachers'
  );
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');
  const { data: subjects } = useSchoolCollection<Subject>(profile?.schoolId, 'subjects');

  const [staffId, setStaffId] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing an existing teacher's class/subject assignment
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editClassIds, setEditClassIds] = useState<string[]>([]);
  const [editSubjectIds, setEditSubjectIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  function toggle(list: string[], value: string, setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!profile?.schoolId || !staffId.trim() || !fullName.trim()) {
      setError(t('staffIdNameRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'schools', profile.schoolId, 'roster_teachers', staffId.trim()), {
        staffId: staffId.trim(),
        fullName: fullName.trim(),
        classIds: selectedClassIds,
        subjectIds: selectedSubjectIds,
        claimedByUid: null,
        approved: true,
      });
      setStaffId('');
      setFullName('');
      setSelectedClassIds([]);
      setSelectedSubjectIds([]);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(teacher: RosterTeacher) {
    setEditingStaffId(teacher.staffId);
    setEditClassIds(teacher.classIds);
    setEditSubjectIds(teacher.subjectIds);
  }

  async function saveEdit(teacher: RosterTeacher) {
    if (!profile?.schoolId) return;
    setSavingEdit(true);
    try {
      await updateDoc(
        doc(db, 'schools', profile.schoolId, 'roster_teachers', teacher.staffId),
        { classIds: editClassIds, subjectIds: editSubjectIds }
      );
      // If this teacher already has a login account, their security-rule
      // write access to results is driven by classIds copied onto their
      // own users/{uid} profile at account-creation time — that copy
      // needs updating too, or the roster change alone won't actually
      // change what they can do.
      if (teacher.claimedByUid) {
        await updateDoc(doc(db, 'users', teacher.claimedByUid), {
          classIds: editClassIds,
        });
      }
      setEditingStaffId(null);
    } finally {
      setSavingEdit(false);
    }
  }

  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center gap-2 sm:gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to="/admin" className="text-white/80 hover:text-white text-sm">
          {t('back')}
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">{t('teachers')}</h1>
        <Link
          to="/admin/teachers/generate-accounts"
          className="text-white/80 hover:text-white text-sm ml-auto"
        >
          {t('generateAccounts')}
        </Link>
      </header>

      <div className="p-8 max-w-3xl">
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5 mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder={t('staffIdLabel')}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('fullName')}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">{t('assignedClasses')}</p>
            <TagToggle
              options={classes}
              selected={selectedClassIds}
              onToggle={(id) => toggle(selectedClassIds, id, setSelectedClassIds)}
              emptyLabel={t('noClassesCreatedYet')}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">{t('subjectsTaught')}</p>
            <TagToggle
              options={subjects}
              selected={selectedSubjectIds}
              onToggle={(id) => toggle(selectedSubjectIds, id, setSelectedSubjectIds)}
              emptyLabel={t('noSubjectsCreatedYet')}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {t('addTeacher')}
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {loading && <p className="p-5 text-sm text-slate-400">{t('loading')}</p>}
          {!loading && teachers.length === 0 && (
            <p className="p-5 text-sm text-slate-400">{t('noTeachersYet')}</p>
          )}
          {teachers.map((teacher) =>
            editingStaffId === teacher.staffId ? (
              <div key={teacher.staffId} className="p-4 space-y-3 bg-slate-50">
                <p className="text-sm font-medium text-slate-900">{teacher.fullName}</p>

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">{t('assignedClasses')}</p>
                  <TagToggle
                    options={classes}
                    selected={editClassIds}
                    onToggle={(id) => toggle(editClassIds, id, setEditClassIds)}
                    emptyLabel={t('noClassesCreatedYet')}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">{t('subjectsTaught')}</p>
                  <TagToggle
                    options={subjects}
                    selected={editSubjectIds}
                    onToggle={(id) => toggle(editSubjectIds, id, setEditSubjectIds)}
                    emptyLabel={t('noSubjectsCreatedYet')}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => saveEdit(teacher)}
                    disabled={savingEdit}
                    className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    {savingEdit ? t('saving') : t('save')}
                  </button>
                  <button
                    onClick={() => setEditingStaffId(null)}
                    disabled={savingEdit}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div key={teacher.staffId} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{teacher.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {teacher.staffId} ·{' '}
                    {teacher.classIds.length > 0
                      ? teacher.classIds.map((id) => classNameById[id] ?? id).join(', ')
                      : t('noClass')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(teacher)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                  >
                    {t('edit')}
                  </button>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      teacher.claimedByUid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {teacher.claimedByUid ? t('accountCreated') : t('pending')}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
