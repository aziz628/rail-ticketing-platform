import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from './trips';
import { queryPolicies } from '@/lib/query-policies';
import type { TripQueryFilters } from '../types';

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: TripQueryFilters) => [...tripKeys.lists(), filters] as const,
  settings: () => [...tripKeys.all, 'settings'] as const,
};

export const useTripsQuery = (filters: TripQueryFilters) => {
  return useInfiniteQuery({
    queryKey: tripKeys.list(filters),
    queryFn: ({ pageParam = 0 }) => 
      tripsApi.getTrips({ ...filters, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.last ? undefined : allPages.length,
    ...queryPolicies.pollingLive,
  });
};

export const useTripSettingsQuery = () => {
  return useQuery({
    queryKey: tripKeys.settings(),
    queryFn: tripsApi.getSettings,
  });
};

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.settings() });
    },
  });
};

export const useSyncTripsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.syncTrips,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
};
