import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { staffApi } from './staff';
import { fetchAllPages } from '@/lib/api-utils';
import type { Controller } from '../types';

export const staffKeys = {
  all: ['staff'] as const,
  agents: () => [...staffKeys.all, 'agents'] as const,
  controllers: () => [...staffKeys.all, 'controllers'] as const,
  controllersAll: () => [...staffKeys.all, 'controllers-all'] as const,
};

export const useAgents = () => {
  return useInfiniteQuery({
    queryKey: staffKeys.agents(),
    queryFn: ({ pageParam = 0 }) => staffApi.getAgents(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
  });
};

export const useControllers = () => {
  return useInfiniteQuery({
    queryKey: staffKeys.controllers(),
    queryFn: ({ pageParam = 0 }) => staffApi.getControllers(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
  });
};

export const useAllControllers = () => {
  return useQuery({
    queryKey: staffKeys.controllersAll(),
    queryFn: () => fetchAllPages<Controller>(staffApi.getControllers),
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.agents() });
    },
  });
};

export const useCreateController = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.createController,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.controllers() });
    },
  });
};

export const useDeactivateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.deactivateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
};
