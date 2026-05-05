import { QueryClient } from '@tanstack/react-query';

/**
 * CACHE CONFIGURATION (React Query Engine)
 * 
 * What it is:
 * This tells React Query exactly how to behave when a user navigates between pages 
 * or loses connection. It sits between the UI and your `api-client.ts`.
 * 
 * Why it is vital:
 * If the user tabs away to check Telegram and comes back, React Query by default 
 * fires an API request. This stalls the backend on heavy apps.
 * `refetchOnWindowFocus: false` prevents this.
 */
export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false, // Do not spam the server when the user switch tab (exist by default for sake of updates to user data)
    retry: 1,                    // One retry helps absorb transient failures while keeping polling responsive.
    staleTime: 1000 * 60,        // Tells React Query that fetched data (like stations) is good for at least 1 minute.
  },
  mutations: {
    //retry is disabled for mutations by default because it causes duplicate API requests
    retry: false,
  },
};

// The global instance attached in provider.tsx
export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
});