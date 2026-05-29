import type { PaginatedResponse } from '@/types/api';

export interface ScheduleStop {
  stationName: string;
  arrivalTime: string; // HH:mm
  kmFromSource: number;
}

export interface Schedule {
  id: string;
  lineName: string;
  trainName: string;
  controllerName: string;
  daysBitmask: string; // e.g. 1110000 or "1110000"
  activationDate: string; // YYYY-MM-DD
  deactivationDate: string | null;
  canDelete: boolean | null;
  canDeactivate: boolean | null;
  minDeactivationDate: string | null;
  stops: ScheduleStop[];
}

export interface ScheduleStopRequest {
  lineNodeId: string;
  arrivalTime: string; // HH:mm
}

export interface CreateScheduleRequest {
  lineId: string;
  trainId: string;
  controllerId: string;
  daysBitmask: string; // e.g. "1110000"
  activationDate: string;
  deactivationDate: string | null;
  stops: ScheduleStopRequest[];
}

export interface ReassignControllerRequest {
  controllerId: string;
}

export interface DeactivateScheduleRequest {
  deactivationDate: string;
}

export type ScheduleStatus = 'ACTIVE' | 'INACTIVE';

export type SchedulesResponse = PaginatedResponse<Schedule>;
