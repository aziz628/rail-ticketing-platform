import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { 
  SchedulesResponse, 
  CreateScheduleRequest, 
  ReassignControllerRequest,
  DeactivateScheduleRequest,
  ScheduleStatus
} from '../types';

interface GetSchedulesParams {
  page?: number;
  status: ScheduleStatus;
  lineId?: string;
}

export const useSchedulesQuery = (params: GetSchedulesParams) => {
  return useQuery({
    queryKey: ['schedules', params],
    queryFn: async () => {
      const { data } = await api.get<SchedulesResponse>(`/schedules/${params.status}`, { 
        params: { 
          page: params.page, 
          lineId: params.lineId 
        } 
      });
      return data;
    },
  });
};

export const useCreateScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduleRequest) => {
      const response = await api.post<void>('/schedules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useDeactivateScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DeactivateScheduleRequest }) => {
      const response = await api.patch<void>(`/schedules/${id}/deactivate`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useDeleteScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/schedules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

export const useReassignControllerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, data }: { scheduleId: string; data: ReassignControllerRequest }) => {
      const response = await api.patch<void>(`/schedules/${scheduleId}/controller`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};
