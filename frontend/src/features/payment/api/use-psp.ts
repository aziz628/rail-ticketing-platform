import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionKeys } from '@/features/subscriptions/api/use-subscriptions';
import { ticketsKeys } from '@/features/ticketing/api/use-tickets';
import { queryPolicies } from '../../../lib/query-policies';
import { pspApi, type PspPayRequest, type PaymentTargetType } from './psp';

export const pspKeys = {
  all: ['psp'] as const,
  session: (id: string) => [...pspKeys.all, 'session', id] as const,
};

export const usePspSession = (id: string) => {
  return useQuery({
    queryKey: pspKeys.session(id),
    queryFn: () => pspApi.getSession(id),
    enabled: !!id,
    retry: false, // Don't retry if session not found
    ...queryPolicies.live,
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: { targetType: PaymentTargetType; data: PspPayRequest }) =>
      pspApi.processPayment(request.targetType, request.data),
    onSuccess: (_, request) => {
      if (request.targetType === 'SUBSCRIPTION') {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      }
      else if (request.targetType === 'TICKET') {
        queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
      }
    },
  });
};
