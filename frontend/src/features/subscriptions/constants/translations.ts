import type { SubscriptionCategoryCode, SubscriptionStatus, SubscriptionRequestStatus, SubscriptionDuration } from '../types/subscriptions';

export const SUBSCRIPTION_CATEGORY_LABELS: Record<SubscriptionCategoryCode, string> = {
  SCOLAIRE: 'Scolaire',
  UNIVERSITAIRE: 'Universitaire',
  PROFESSIONNEL: 'Professionnel',
  CIVIL: 'Civil',
};

export const DURATION_LABELS: Record<SubscriptionDuration, string> = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  AWAITING_PAYMENT: 'En attente de paiement',
  ACTIVE: 'Active',
  EXPIRED: 'Expirée',
};

export const REQUEST_STATUS_LABELS: Record<SubscriptionRequestStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
};
