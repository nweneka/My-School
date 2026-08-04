import { useState } from 'react';
import * as XLSX from 'xlsx';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { useTranslation } from '../../lib/i18n';
import type { SchoolClass } from '../../types';
import { Link } from 'react-router-dom';

type ParsedRow = {
  rowNumber: number;
  admissionNo: string;
  fullName: string;
  dateOfBirth: string; // normalized to YYYY-MM-DD
  className: string;
  classId: string | null;
  error: string | null;
};

// Header matching is intentionally forgiving — French/English, with or
// without accents, spacing, or punctuation — since schools will name their
// spreadsheet columns however they're used to, not however we'd prefer.
function normalizeHeader(h: string) {
  return h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const HEADER_ALIASES: Record<string, string[]> = {
  admissionNo: ['admissionno', 'numeroadmission', 'nadmission', 'matricule', 'admission'],
  fullName: ['fullname', 'nom', 'nomcomplet', 'nometprenom', 'nomprenom', 'name'],
  dateOfBirth: ['dateofbirth', 'datedenaissance', 'naissance', 'dob'],
  className: ['class', 'classe'],
};

function findField(headers: string[], target: string): string | null {
  const aliases = HEADER_ALIASES[target];
  return headers.find((h) => aliases.includes(normalizeHeader(h))) ?? null;
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const s = value.trim();
    // YYYY-MM-DD already
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // DD/MM/YYYY or DD-MM-YYYY (the common Francophone-Africa format)
    const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return null;
}

export default function AdminStudentsImport() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');
  const classIdByName = Object.fromEntries(
    classes.map((c) => [c.name.trim().toLowerCase(), c.id])
  );

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImported(false);

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (raw.length === 0) {
      setRows([]);
      return;
    }

    const headers = Object.keys(raw[0]);
    const admissionField = findField(headers, 'admissionNo');
    const nameField = findField(headers, 'fullName');
    const dobField = findField(headers, 'dateOfBirth');
    const classField = findField(headers, 'className');

    if (!admissionField || !nameField || !dobField || !classField) {
      setRows([
        {
          rowNumber: 0,
          admissionNo: '',
          fullName: '',
          dateOfBirth: '',
          className: '',
          classId: null,
          error: t('missingColumns'),
        },
      ]);
      return;
    }

    const parsed: ParsedRow[] = raw.map((r, i) => {
      const admissionNo = String(r[admissionField] ?? '').trim();
      const fullName = String(r[nameField] ?? '').trim();
      const className = String(r[classField] ?? '').trim();
      const dateOfBirth = parseDate(r[dobField]) ?? '';
      const classId = classIdByName[className.toLowerCase()] ?? null;

      let error: string | null = null;
      if (!admissionNo) error = t('missingAdmissionNo');
      else if (!fullName) error = t('missingName');
      else if (!dateOfBirth) error = t('invalidDob');
      else if (!classId) error = `${t('classLabel')} "${className}" ${t('classNotFound')}`;

      return {
        rowNumber: i + 2, // +2: header row + 1-indexing, matches spreadsheet row numbers
        admissionNo,
        fullName,
        dateOfBirth,
        className,
        classId,
        error,
      };
    });

    setRows(parsed);
  }

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => r.error);

  async function handleImport() {
    if (!profile?.schoolId || validRows.length === 0) return;
    setImporting(true);
    try {
      // Firestore batches cap at 500 writes — chunk if a school's roster is larger.
      for (let i = 0; i < validRows.length; i += 450) {
        const chunk = validRows.slice(i, i + 450);
        const batch = writeBatch(db);
        for (const row of chunk) {
          const ref = doc(db, 'schools', profile.schoolId, 'roster_students', row.admissionNo);
          batch.set(ref, {
            admissionNo: row.admissionNo,
            fullName: row.fullName,
            dateOfBirth: row.dateOfBirth,
            classId: row.classId,
            claimedByUid: null,
          });
        }
        await batch.commit();
      }
      setImported(true);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to="/admin/students" className="text-white/80 hover:text-white text-sm">
          {t('back')}
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">{t('importStudentsTitle')}</h1>
      </header>

      <div className="p-8 max-w-3xl">
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-sm text-slate-700 mb-1">
            {t('importInstructions')}{' '}
            <span className="font-medium">{t('importColumnsList')}</span>
          </p>
          <p className="text-xs text-slate-500 mb-4">
            {t('importNote')}
          </p>

          <label className="inline-block cursor-pointer text-sm font-medium text-slate-900 border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50">
            {t('chooseFile')}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>
          {fileName && <p className="text-xs text-slate-500 mt-2">{fileName}</p>}
        </div>

        {rows.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-3 text-sm">
              <span className="text-emerald-700 font-medium">{validRows.length} {t('validRows')}</span>
              {errorRows.length > 0 && (
                <span className="text-red-600 font-medium">{errorRows.length} {t('errorRows')}</span>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {rows.map((r) => (
                <div key={r.rowNumber} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-900">
                      L{r.rowNumber}: {r.fullName || '—'} ({r.admissionNo || '—'})
                    </span>
                  </div>
                  {r.error ? (
                    <span className="text-xs text-red-600">{r.error}</span>
                  ) : (
                    <span className="text-xs text-emerald-600">{r.className}</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0 || imported}
              className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {imported
                ? t('imported')
                : importing
                  ? t('importing')
                  : `${t('importButton')} ${validRows.length} ${t('studentsCount')}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
