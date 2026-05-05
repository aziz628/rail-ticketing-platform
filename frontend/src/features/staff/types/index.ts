import type { PaginatedResponse } from '@/types/api';

export interface Agent {
  id: string;
  name: string;
  email: string;
  canDelete: boolean;
}

export interface Controller {
  id: string;
  name: string;
  email: string;
  assignedLineName: string;
  canDelete: boolean;
}

export interface CreateAgentRequest {
  name: string;
  email: string;
}

export interface CreateControllerRequest {
  name: string;
  email: string;
  lineId: string;
}

export type AgentsResponse = PaginatedResponse<Agent>;
export type ControllersResponse = PaginatedResponse<Controller>;
