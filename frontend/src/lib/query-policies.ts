/*
    * query policies defined for React Query api hooks 
    * The policies specify how long data is considered to keep stale data and when to refetch on component mount.
    * static policy is for data that doesn't change often
    * live policy is for data that needs to be up-to-date
    * pollingLive policy is for data that should be refetched at regular intervals (e.g. every 30 seconds)
*/
export const queryPolicies = {
  static: {
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  },
  live: {
    staleTime: 0,
    refetchOnMount: 'always' as const,
  },
  pollingLive: {
    staleTime: 0,
    refetchOnMount: 'always' as const,
    refetchInterval: 10_000, // Refetch every 10 seconds
    refetchIntervalInBackground: false,
  },
} as const;