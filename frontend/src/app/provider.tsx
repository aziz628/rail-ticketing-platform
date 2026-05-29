import { QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useEffect } from 'react';
import { queryClient } from '../lib/react-query';
import { useAuthStore } from '@/stores/auth';
import { useMeQuery } from '@/features/auth/api/use-auth';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { Notifications } from '@/components/ui/notifications/notifications';
import { useLocation } from 'react-router-dom';
import { PATHS, isStaffPath } from '@/app/paths';


type ViewModeContextType = {
  isStaff: boolean;
  paths: typeof PATHS.VOYAGER | typeof PATHS.STAFF;
};

/**
 * VIEW MODE CONTEXT
 * 
 * Provides information about whether the user is in the Staff area or Voyager area
 * based on the current URL.
 */
const ViewModeContext = React.createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const context = React.useContext(ViewModeContext);
  if (!context) throw new Error('useViewMode must be used within a ViewModeProvider');
  return context;
};


const ViewModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const isStaff = isStaffPath(pathname);
  
  const value = React.useMemo(() => ({
    isStaff,
    paths: isStaff ? PATHS.STAFF : PATHS.VOYAGER,
  }), [isStaff]);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
};

/**
 * GLOBAL WRAPPER
 *
 * unified provider that allows easy single-point access to all global state providers
 */

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Notifications />
      <ViewModeProvider>
        <AuthBootstrapGate>
          {children}
        </AuthBootstrapGate>
      </ViewModeProvider>
    </QueryClientProvider>
  );
};


/**
 * AUTH BOOTSTRAP GATE
 * 
 * Role is checking existence of active session on initial app load using "/me" endpoint.
 *
 */
const AuthBootstrapGate = ({ children }: AppProviderProps) => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const setSessionLoading = useAuthStore((s) => s.setSessionLoading);
  const isSessionLoading = useAuthStore((s) => s.isSessionLoading);

  // runs useMeQuery for knowing if the user has an active session or not on initial app load
  const { data, isSuccess, isError, isPending } = useMeQuery(isSessionLoading);

  useEffect(() => {
    // only run this effect on initial app load, we're checking if the user has an active session by hitting the /me endpoint.
    if (!isSessionLoading) return;

    if (isSuccess && data) {
      setAuth(data);
      setSessionLoading(false);
      return;
    }

    if (isError) {
      logout();
      setSessionLoading(false);
    }
  }, [data, isSuccess, isError, isSessionLoading, setAuth, logout, setSessionLoading]);

  // While checking for an active session, show a loading spinner.
  if (isSessionLoading || isPending) {
    return <RotatingLoader fullScreen label="Checking session..." />;
  }

  return <>{children}</>;
};