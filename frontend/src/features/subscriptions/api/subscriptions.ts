import { api } from '@/lib/api-client';
import type {
  SubscriptionCategoryResponse,
  SubscriptionCategoryPatchRequest,
  SubscriptionRequestFormValues,
  SubscriptionRequestResponse,
  SubscriptionResponse,
  StaffSubscriptionRequestResponse,
  SubscriptionFilter,
  SubscriptionRequestStatus,
  SubscriptionRejectRequest,
} from '../types/subscriptions';
import type { PaginatedResponse } from '@/types/api';

export const subscriptionsApi = {
  getCategories: async () => {
    const response = await api.get<SubscriptionCategoryResponse[]>('/subscription-categories');
    return response.data;
  },
  patchCategory: async (id: string, data: SubscriptionCategoryPatchRequest) => {
    const response = await api.patch(`/subscription-categories/${id}`, data);
    return response.data;
  },
  createSubscriptionRequest: async (data: SubscriptionRequestFormValues) => {
    const formData = new FormData();
    formData.append('categoryName', data.categoryName);
    formData.append('duration', data.duration);
    formData.append('lineId', data.lineId);
    if (data?.proofFile) {
      formData.append('proofFile', data.proofFile);
    }

    const response = await api.post<SubscriptionRequestResponse>('/subscription-requests', formData);
    return response.data;
  },
  getMySubscriptions: async (filter: SubscriptionFilter, page: number) => {
    const response = await api.get<PaginatedResponse<SubscriptionResponse>>(`/subscriptions/${filter}`, {
      params: { page },
    });

    return response.data;
  },
  getMyRequests: async (page: number) => {
    const response = await api.get<PaginatedResponse<SubscriptionRequestResponse>>('/subscription-requests/me', {
      params: { page },
    });

    return response.data;
  },
  initiateSubscriptionPayment: async (subscriptionId: string) => {
    const response = await api.post<{ pspSessionId: string }>(`/subscriptions/${subscriptionId}/initiate-payment`);
    return response.data;
  },
  getStaffRequests: async (status: SubscriptionRequestStatus, page: number) => {
    const response = await api.get<{ content: StaffSubscriptionRequestResponse[]; last: boolean }>(
      `/staff/subscription-requests/${status}`,
      {
        params: { page },
      }
    );

    return response.data;
  },
  approveSubscriptionRequest: async (id: string) => {
    const response = await api.patch(`/staff/subscription-requests/${id}/approve`);
    return response.data;
  },
  rejectSubscriptionRequest: async (id: string, data: SubscriptionRejectRequest) => {
    const response = await api.patch(`/staff/subscription-requests/${id}/reject`, data);
    return response.data;
  },
  getSubscriptionRequestProof: async (requestId: string) => {
    const response = await api.get(`/staff/subscription-requests/${requestId}/proof`, {
      responseType: 'blob',
    });

    return response.data as Blob;
  },
};
