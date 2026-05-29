import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SubscriptionCategoryPatchRequest,
  SubscriptionRejectRequest,
  SubscriptionRequestFormValues,
  SubscriptionFilter,
  SubscriptionRequestStatus,
} from '../types/subscriptions';
import { queryPolicies } from '../../../lib/query-policies';
import { subscriptionsApi } from './subscriptions';

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  categories: () => [...subscriptionKeys.all, 'categories'] as const,
  mySubscriptions: (filter: SubscriptionFilter) => [...subscriptionKeys.all, 'my-subscriptions', filter] as const,
  myRequests: () => [...subscriptionKeys.all, 'my-requests'] as const,
  staffRequests: (status: SubscriptionRequestStatus) => [...subscriptionKeys.all, 'staff-requests', status] as const,
  proof: (requestId: string) => [...subscriptionKeys.all, 'proof', requestId] as const,
};

export const useSubscriptionCategories = () => {
  return useQuery({
    queryKey: subscriptionKeys.categories(),
    queryFn: () => subscriptionsApi.getCategories(),
    ...queryPolicies.static,
  });
};

export const useUpdateSubscriptionCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubscriptionCategoryPatchRequest }) => 
      subscriptionsApi.patchCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.categories() });
    },
  });
};

export const useCreateSubscriptionRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubscriptionRequestFormValues) => subscriptionsApi.createSubscriptionRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
};


export const useMySubscriptions = (filter: SubscriptionFilter, enabled = true) => {
  return useInfiniteQuery({
    queryKey: subscriptionKeys.mySubscriptions(filter),
    queryFn: ({ pageParam = 0 }) => subscriptionsApi.getMySubscriptions(filter, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
    enabled,
    ...queryPolicies.pollingLive,
  });
};

export const useMySubscriptionRequests = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: subscriptionKeys.myRequests(),
    queryFn: ({ pageParam = 0 }) => subscriptionsApi.getMyRequests(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
    enabled,
    ...queryPolicies.pollingLive,
  });
};

export const useInitiateSubscriptionPaymentMutation = () => {
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionsApi.initiateSubscriptionPayment(subscriptionId),
  });
};

export const useStaffSubscriptionRequests = (status: SubscriptionRequestStatus, enabled = true) => {
  return useInfiniteQuery({
    queryKey: subscriptionKeys.staffRequests(status),
    queryFn: ({ pageParam = 0 }) => subscriptionsApi.getStaffRequests(status, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
    enabled,
    ...queryPolicies.pollingLive,
  });
};

export const useApproveSubscriptionRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => subscriptionsApi.approveSubscriptionRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
};

export const useRejectSubscriptionRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: SubscriptionRejectRequest }) =>
      subscriptionsApi.rejectSubscriptionRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
};

export const useSubscriptionRequestProof = (requestId: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: requestId ? subscriptionKeys.proof(requestId) : subscriptionKeys.proof('none'),
    queryFn: () => subscriptionsApi.getSubscriptionRequestProof(requestId || ''),
    enabled: enabled && Boolean(requestId),
  });
};
