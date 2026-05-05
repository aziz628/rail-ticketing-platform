import { api } from '@/lib/api-client';
import type { 
  AgentsResponse, 
  ControllersResponse, 
  CreateAgentRequest, 
  CreateControllerRequest 
} from '../types';

export const staffApi = {
  getAgents: async (page = 0) => {
    const response = await api.get<AgentsResponse>('/staff/agents', {
      params: { page, size: 10 },
    });
    return response.data;
  },

  getControllers: async (page = 0) => {
    const response = await api.get<ControllersResponse>('/staff/controllers', {
      params: { page, size: 10 },
    });
    return response.data;
  },

  createAgent: async (data: CreateAgentRequest) => {
    return api.post('/staff/agents', data);
  },

  createController: async (data: CreateControllerRequest) => {
    return api.post('/staff/controllers', data);
  },

  deactivateStaff: async (id: string) => {
    return api.delete(`/staff/agents/${id}`);
  },
};
