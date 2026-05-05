import { api } from '@/lib/api-client';
import type {
  Station,
  StationRequest,
  Train,
  TrainRequest,
  TrainPatchRequest,
  SeatClassPatchRequest,
  Line,
  LineRequest,
} from '../types';

import type { PaginatedResponse } from '@/types/api';

export const infrastructureApi = {
  // Stations
  getStations: async (page = 0) => {
    const response = await api.get<PaginatedResponse<Station>>(`/stations?page=${page}`);
    return response.data;
  },
  createStation: async (data: StationRequest): Promise<void> => {
    await api.post('/stations', data);
  },
  updateStation: async (id: string, data: StationRequest): Promise<void> => {
    await api.put(`/stations/${id}`, data);
  },
  deleteStation: async (id: string): Promise<void> => {
    await api.delete(`/stations/${id}`);
  },

  // Trains
  getTrains: async (page = 0) => {
    const response = await api.get<PaginatedResponse<Train>>(`/trains?page=${page}`);
    return response.data;
  },
  createTrain: async (data: TrainRequest): Promise<void> => {
    await api.post('/trains', data);
  },
  updateTrain: async (id: string, data: TrainPatchRequest): Promise<void> => {
    await api.patch(`/trains/${id}`, data);
  },
  updateSeatClass: async (trainId: string, classId: string, data: SeatClassPatchRequest): Promise<void> => {
    await api.patch(`/trains/${trainId}/seat-classes/${classId}`, data);
  },
  deleteTrain: async (id: string): Promise<void> => {
    await api.delete(`/trains/${id}`);
  },

  // Lines
  getLines: async (page = 0) => {
    const response = await api.get<PaginatedResponse<Line>>(`/lines?page=${page}`);
    return response.data;
  },
  createLine: async (data: LineRequest): Promise<void> => {
    await api.post('/lines', data);
  },
  deleteLine: async (id: string): Promise<void> => {
    await api.delete(`/lines/${id}`);
  },
};
