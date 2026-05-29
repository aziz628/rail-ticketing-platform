import { api } from '@/lib/api-client';
import type { Trip, TripGenerationSettings, TripQueryFilters } from '../types';
import type { PaginatedResponse } from '@/types/api';

export const tripsApi = {
  getTrips: async (filters: TripQueryFilters) => {
    const response = await api.get<PaginatedResponse<Trip>>('/trips', {
      params: {
        ...filters,
      },
    });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get<TripGenerationSettings>('/trips/settings');
    return response.data;
  },

  updateSettings: async (settings: TripGenerationSettings) => {
    await api.put('/trips/settings', settings);
  },

  syncTrips: async () => {
    await api.post('/trips/sync');
  },
};
