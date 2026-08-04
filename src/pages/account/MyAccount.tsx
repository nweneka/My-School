import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useTranslation } from '../../lib/i18n';

function backLinkFor(role: string | undefined) {
  if (role === 'admin' || role === 'superadmin') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/student';
}

export default function MyAccount() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const isStaff = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin';
  const canChangeEmail = isStaff;
  const canChangePassword = isStaff;

  async function reauthenticate(currentPasswordValue: string) {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('no-user');
    const credential = EmailAuthProvider.credential(user.email, currentPasswordValue);
    await reauthenticateWithCredential(user, credential);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: t('passwordTooShort') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('passwordsDontMatch') });
      return;
    }

    setPasswordSaving(true);
    try {
      await reauthenticate(currentPassword);
      await updatePassword(auth.currentUser!, newPassword);
      setPasswordMessage({ type: 'ok', text: t('passwordUpdated') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : '';
      const text =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? t('wrongCurrentPassword')
          : t('updateFailed');
      setPasswordMessage({ type: 'error', text });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMessage(null);

    if (!newEmail.includes('@')) {
      setEmailMessage({ type: 'error', text: t('invalidEmail') });
      return;
    }

    setEmailSaving(true);
    try {
      await reauthenticate(emailCurrentPassword);
      await updateEmail(auth.currentUser!, newEmail.trim());
      setEmailMessage({
        type: 'ok',
        text: t('emailUpdated'),
      });
      setNewEmail('');
      setEmailCurrentPassword('');
    } catch (err) {
      const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : '';
      const text =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? t('wrongCurrentPassword')
          : code === 'auth/email-already-in-use'
            ? t('emailAlreadyInUse')
            : t('updateFailed');
      setEmailMessage({ type: 'error', text });
    } finally {
      setEmailSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-8 py-5 flex items-center gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        <Link to={backLinkFor(profile?.role)} className="text-white/80 hover:text-white text-sm">
          {t('back')}
        </Link>
        <h1 className="text-white font-semibold text-lg ml-2">{t('myAccount')}</h1>
      </header>

      <div className="p-8 max-w-lg space-y-8">
        {canChangePassword ? (
          <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-medium text-slate-700">{t('changePassword')}</h2>

            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">{t('currentPassword')}</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">{t('newPassword')}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">{t('confirmNewPassword')}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                {passwordMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {passwordSaving ? t('saving') : t('updatePassword')}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-medium text-slate-700 mb-2">{t('changePassword')}</h2>
            <p className="text-sm text-slate-500">{t('studentPasswordLocked')}</p>
          </div>
        )}

        {canChangeEmail && (
          <form onSubmit={handleChangeEmail} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-slate-700">{t('changeEmail')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {t('currentEmailLabel')} {profile?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">{t('newEmail')}</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">{t('currentPassword')}</label>
              <input
                type="password"
                required
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {emailMessage && (
              <p className={`text-sm ${emailMessage.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                {emailMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={emailSaving}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {emailSaving ? t('saving') : t('updateEmailButton')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
