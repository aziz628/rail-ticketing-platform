import { useMutation, useQuery } from '@tanstack/react-query';
import { queryPolicies } from '@/lib/query-policies';
import { dashboardApi } from './dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardApi.getStats,
    ...queryPolicies.pollingLive,
  });
};

export const useExportTransactions = () => {
  return useMutation({
    mutationFn: dashboardApi.exportTransactions,
  });
};