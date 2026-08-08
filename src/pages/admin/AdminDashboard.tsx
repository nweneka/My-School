import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useSchoolCollection } from '../../hooks/useSchoolCollection';
import { LogoutButton } from '../../components/LogoutButton';
import { useTranslation } from '../../lib/i18n';
import { getSubscriptionState } from '../../lib/subscription';
import type { RosterStudent, SchoolClass } from '../../types';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const { t } = useTranslation();
  const subscription = getSubscriptionState(school);
  const { data: students } = useSchoolCollection<RosterStudent>(profile?.schoolId, 'roster_students');
  const { data: classes } = useSchoolCollection<SchoolClass>(profile?.schoolId, 'classes');

  const cards = [
    { label: t('students'), count: students.length, to: '/admin/students' },
    { label: t('teachers'), count: '—', to: '/admin/teachers' },
    { label: t('classes'), count: classes.length, to: '/admin/classes' },
    { label: t('results'), count: '—', to: '/admin/results' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="px-4 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center gap-2 sm:gap-3"
        style={{ backgroundColor: school?.primaryColor ?? '#0f172a' }}
      >
        {school?.logoUrl && (
          <img src={school.logoUrl} alt="" className="h-8 w-8 rounded-full bg-white object-cover" />
        )}
        <h1 className="text-white font-semibold text-lg">
          {school?.name ?? 'My School'}
        </h1>
        <span
          className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full text-slate-900"
          style={{ backgroundColor: school?.secondaryColor ?? '#e2e8f0' }}
        >
          {school?.currentSession ?? '—'} · T{school?.currentTerm ?? '—'}
        </span>
        <Link to="/admin/settings" className="text-white/80 hover:text-white text-sm ml-3">
          {t('settings')}
        </Link>
        <Link to="/account" className="text-white/80 hover:text-white text-sm ml-3">
          {t('myAccount')}
        </Link>
        <LogoutButton className="ml-3" />
      </header>

      <div className="p-8">
        {(subscription.status === 'expired' || subscription.isExpiringSoon || subscription.status === 'trial') && (
          <div
            className={`mb-6 rounded-lg p-4 text-sm ${
              subscription.status === 'expired'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            {subscription.status === 'expired' && school?.plan === 'active' && t('subscriptionExpired')}
            {subscription.status === 'expired' && school?.plan !== 'active' && t('trialExpired')}
            {subscription.status === 'trial' && subscription.daysLeft !== null &&
              t('trialDaysLeft', { days: subscription.daysLeft })}
            {subscription.status === 'active' && subscription.isExpiringSoon && subscription.daysLeft !== null &&
              t('subscriptionDaysLeft', { days: subscription.daysLeft })}
          </div>
        )}

        <h2 className="text-2xl font-semibold text-slate-900">{t('adminDashboardTitle')}</h2>
        <p className="text-slate-500 mt-1">{t('welcome')}, {profile?.displayName}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="rounded-xl border border-slate-200 p-5 bg-white border-t-4 hover:shadow-sm transition-shadow"
              style={{ borderTopColor: school?.primaryColor ?? '#0f172a' }}
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{card.count}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
