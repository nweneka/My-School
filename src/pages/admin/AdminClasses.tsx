import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { useTranslation } from '../../lib/i18n';
import type { SchoolClass } from '../../types';
import { Link } from 'react-router-dom';

export default function AdminClasses() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();
  const { data: classes, loading } = useSchoolCollection<SchoolClass>(
    profile?.schoolId,
    'classes'
  );

  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.schoolId || !name.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'schools', profile.schoolId, 'classes'), {
        name: name.trim(),
        level: level.trim(),
      });
      setName('');
      setLevel('');
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
          {t('back')}
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">{t('classes')}</h1>
        <Link to="/admin/subjects" className="text-white/80 hover:text-white text-sm ml-auto">
          {t('subjectsLink')}
        </Link>
      </header>

      <div className="p-8 max-w-2xl">
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5 mb-8 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('classNamePlaceholder')}
            required
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder={t('levelPlaceholder')}
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {t('add')}
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {loading && <p className="p-5 text-sm text-slate-400">{t('loading')}</p>}
          {!loading && classes.length === 0 && (
            <p className="p-5 text-sm text-slate-400">{t('noClassesYet')}</p>
          )}
          {classes.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">{c.name}</span>
              <span className="text-xs text-slate-500">{c.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
