import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/api';

export type TicketStatus = 'PAID' | 'USED';

export const TICKET_FILTERS = {
  UPCOMING: 'UPCOMING',
  PAST: 'PAST',
} as const;

export type TicketFilter = keyof typeof TICKET_FILTERS;

export type TicketResponse = {
  id: string;
  tripNumber: string;
  date: string;
  originStationName: string;
  destinationStationName: string;
  departureTime: string;
  arrivalTime: string;
  seatClassName: string;
  price: number;
  status: TicketStatus;
};

export type TripSearchResponse = {
  tripId: string;
  lineName: string;
  trainName: string;
  originStationName: string;
  destinationStationName: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  bookingDeadlineExpired: boolean;
  hasAvailableSeats: boolean;
};

export type TripDetailsResponse = {
  tripId: string;
  lineName: string;
  trainName: string;
  originName: string;
  destinationName: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  bookingDeadlineExpired: boolean;
  isAlreadyBought?: boolean;
  userBlocked?: boolean;
  freeBookingAllowed?: boolean;
  seatClasses: SeatClassPriceResponse[];
};

export type SeatClassPriceResponse = {
  id: string;
  type: string;
  distancePrice: number;
  basePrice: number;
  finalPrice: number;
  available: boolean;
};

type TicketPaymentInitiateResponse = {
  pspSessionId: string;
};


export const ticketsApi = {
  searchTrips: async (params: { originId: string; destinationId: string; date: string; page: number }) => {
    const response = await api.get<PaginatedResponse<TripSearchResponse>>('/trips/search', {
      params: {
        originId: params.originId,
        destinationId: params.destinationId,
        date: params.date,
        page: params.page,
      }
    });
    return response.data;
  },
  getBookingDetails: async (id: string, params: { originId: string; destinationId: string }) => {
    const response = await api.get<TripDetailsResponse>(`/trips/${id}/booking-details`, { params });
    return response.data;
  },
  initiatePayment: async (data: { tripId: string; originLineNodeId: string; destinationLineNodeId: string; seatClassId: string }) => {
    const response = await api.post<TicketPaymentInitiateResponse>('/tickets/initiate-payment', data);
    return response.data;
  },
  bookFree: async (data: { tripId: string; originLineNodeId: string; destinationLineNodeId: string; seatClassId: string }) => {
    const response = await api.post<TicketResponse>('/tickets/book-free', data);
    return response.data;
  },
  getTickets: async (filter: TicketFilter, page: number) => {
    const response = await api.get<PaginatedResponse<TicketResponse>>(`/tickets/${filter}?page=${page}`);
    return response.data;
  },
  downloadTicket: async (id: string) => {
    const response = await api.get(`/tickets/${id}/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
