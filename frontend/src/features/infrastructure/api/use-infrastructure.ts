import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { infrastructureApi } from './infrastructure';
import { fetchAllPages } from '@/lib/api-utils';
import type {
  Station,
  StationRequest,
  Train,
  Line,
  TrainPatchRequest,
  SeatClassPatchRequest,
} from '../types';

// keys of the queries used in the infrastructure feature
export const infrastructureKeys = {
  all: ['infrastructure'] as const, // base key for all queries
  stations: () => [...infrastructureKeys.all, 'stations'] as const,
  stationsAll: () => [...infrastructureKeys.all, 'stations-all'] as const,
  trains: () => [...infrastructureKeys.all, 'trains'] as const,
  trainsAll: () => [...infrastructureKeys.all, 'trains-all'] as const,
  lines: () => [...infrastructureKeys.all, 'lines'] as const,
  linesAll: () => [...infrastructureKeys.all, 'lines-all'] as const,
};

// Stations Hooks

export const useStations = () => {
  // fetch all existing stations using infinite pagination.
  return useInfiniteQuery({
    queryKey: infrastructureKeys.stations(),
    queryFn: ({ pageParam = 0 }) => infrastructureApi.getStations(pageParam as number),
    initialPageParam: 0,
    // use "last" attribute from the response to determine if we need to fetch more data.
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
  });
};

// get all stations in one hook for forms that need the full list.
export const useAllStations = () => {
  return useQuery({
    queryKey: infrastructureKeys.stationsAll(),
    queryFn: () => fetchAllPages<Station>(infrastructureApi.getStations),
  });
} 


export const useCreateStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: infrastructureApi.createStation,
    onSuccess: () => {
      // after invalidating queries, the query will be refetch.
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.stations() });
    },
  });
};

export const useUpdateStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StationRequest }) =>
      infrastructureApi.updateStation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.stations() });
    },
  });
};

export const useDeleteStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: infrastructureApi.deleteStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.stations() });
    },
  });
};

// Trains Hooks
export const useTrains = () => {
  return useInfiniteQuery({
    queryKey: infrastructureKeys.trains(),
    queryFn: ({ pageParam = 0 }) => infrastructureApi.getTrains(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
  });
};

export const useAllTrains = () => {
  return useQuery({
    queryKey: infrastructureKeys.trainsAll(),
    queryFn: () => fetchAllPages<Train>(infrastructureApi.getTrains),
  });
};

export const useCreateTrain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: infrastructureApi.createTrain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.trains() });
    },
  });
};

export const useUpdateTrain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrainPatchRequest }) =>
      infrastructureApi.updateTrain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.trains() });
    },
  });
};

export const useUpdateSeatClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trainId, classId, data }: { trainId: string; classId: string; data: SeatClassPatchRequest }) =>
      infrastructureApi.updateSeatClass(trainId, classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.trains() });
    },
  });
};

export const useDeleteTrain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: infrastructureApi.deleteTrain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.trains() });
    },
  });
};

// Lines Hooks
export const useLines = () => {
  return useInfiniteQuery({
    queryKey: infrastructureKeys.lines(),
    queryFn: ({ pageParam = 0 }) => infrastructureApi.getLines(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
  });
};

export const useAllLines = () => {
  return useQuery({
    queryKey: infrastructureKeys.linesAll(),
    queryFn: () => fetchAllPages<Line>(infrastructureApi.getLines),
  });
};

export const useCreateLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: infrastructureApi.createLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.lines() });
    },
  });
};

export const useDeleteLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: infrastructureApi.deleteLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infrastructureKeys.lines() });
    },
  });
};
