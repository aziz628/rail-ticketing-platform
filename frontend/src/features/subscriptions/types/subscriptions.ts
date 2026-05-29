export type SubscriptionCategoryCode = 'SCOLAIRE' | 'UNIVERSITAIRE' | 'PROFESSIONNEL' | 'CIVIL';
export type SubscriptionDuration = 'MONTHLY' | 'QUARTERLY';
export type SubscriptionFilter = 'CURRENT' | 'EXPIRED';
export type SubscriptionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SubscriptionStatus = 'AWAITING_PAYMENT' | 'ACTIVE' | 'EXPIRED';

export interface SubscriptionCategoryResponse {
  id: string;
  name: SubscriptionCategoryCode;
  monthlyPrice: number;
  quarterlyPrice: number;
}

export interface SubscriptionCategoryPatchRequest {
  monthlyPrice: number;
  quarterlyPrice: number;
}

export interface SubscriptionRequestFormValues {
  categoryName: SubscriptionCategoryCode;
  duration: SubscriptionDuration;
  lineId: string;
  proofFile?: File;
}

export interface SubscriptionRequestResponse {
  id: string;
  categoryName: SubscriptionCategoryCode;
  duration: SubscriptionDuration;
  lineName: string;
  status: SubscriptionRequestStatus;
  createdAt: string;
  rejectReason?: string;
}

export interface SubscriptionResponse {
  id: string;
  requestId: string;
  lineName: string;
  categoryName: SubscriptionCategoryCode;
  duration: SubscriptionDuration;
  expireDate: string | null;
  status: SubscriptionStatus;
}

export interface StaffSubscriptionRequestResponse {
  id: string;
  voyagerName: string;
  lineName: string;
  categoryName: SubscriptionCategoryCode;
  duration: SubscriptionDuration;
  status: SubscriptionRequestStatus;
  rejectReason?: string;
  createdAt: string;
}

export interface SubscriptionRejectRequest {
  rejectReason: string;
}
