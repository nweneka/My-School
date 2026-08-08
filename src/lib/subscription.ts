import type { School } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WARNING_WINDOW_DAYS = 90;

export type SubscriptionState = {
  status: 'trial' | 'active' | 'expired' | 'unknown';
  daysLeft: number | null;
  isExpiringSoon: boolean;
};

export function getSubscriptionState(school: School | null): SubscriptionState {
  if (!school) return { status: 'unknown', daysLeft: null, isExpiringSoon: false };

  const now = Date.now();

  if (school.plan === 'active' && school.subscriptionEndsAt) {
    const daysLeft = Math.ceil((school.subscriptionEndsAt - now) / DAY_MS);
    return {
      status: daysLeft > 0 ? 'active' : 'expired',
      daysLeft,
      isExpiringSoon: daysLeft > 0 && daysLeft <= WARNING_WINDOW_DAYS,
    };
  }

  if (school.trialEndsAt) {
    const daysLeft = Math.ceil((school.trialEndsAt - now) / DAY_MS);
    return {
      status: daysLeft > 0 ? 'trial' : 'expired',
      daysLeft,
      isExpiringSoon: false,
    };
  }

  return { status: 'unknown', daysLeft: null, isExpiringSoon: false };
}
