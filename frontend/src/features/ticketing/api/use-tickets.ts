import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import { ticketsApi, type TicketFilter } from './tickets';
import { queryPolicies } from '@/lib/query-policies';
import { queryClient } from '@/lib/react-query';

export const ticketsKeys = {
  all: ['tickets'] as const,
  search: (params: any) => [...ticketsKeys.all, 'search', params] as const,
  bookingDetails: (id: string, params: any) => [...ticketsKeys.all, 'booking', id, params] as const,
  lists: () => [...ticketsKeys.all, 'list'] as const,
  list: (filter: string) => [...ticketsKeys.lists(), { filter }] as const,
};

export const useSearchTrips = (params: { originId: string; destinationId: string; date: string }) => {
  return useInfiniteQuery({
    queryKey: ticketsKeys.search(params),
    queryFn: ({ pageParam = 0 }) => 
      ticketsApi.searchTrips({ ...params, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
    enabled: !!params.originId && !!params.destinationId && !!params.date,
    ...queryPolicies.pollingLive,
  });
};

export const useBookingDetails = (id: string, params: { originId: string; destinationId: string }) => {
  return useQuery({
    queryKey: ticketsKeys.bookingDetails(id, params),
    queryFn: () => ticketsApi.getBookingDetails(id, params),
    enabled: !!id && !!params.originId && !!params.destinationId,
    ...queryPolicies.pollingLive,
  });
};

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: (request: { tripId: string; originLineNodeId: string; destinationLineNodeId: string; seatClassId: string }) =>
      ticketsApi.initiatePayment(request),
  });
};

export const useBookFree = () => {
  return useMutation({
    mutationFn: (request: { tripId: string; originLineNodeId: string; destinationLineNodeId: string; seatClassId: string }) =>
      ticketsApi.bookFree(request),
    onSuccess: () => {
      // Invalidate tickets list to show the newly booked ticket
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
    }
    
  });
};

export const useTickets = (filter: TicketFilter) => {
  return useInfiniteQuery({
    queryKey: ticketsKeys.list(filter),
    queryFn: ({ pageParam = 0 }) => 
      ticketsApi.getTickets(filter, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
  });
};

export const useDownloadTicket = () => {
  return useMutation({
    mutationFn: (id: string) => ticketsApi.downloadTicket(id),
  });
};
