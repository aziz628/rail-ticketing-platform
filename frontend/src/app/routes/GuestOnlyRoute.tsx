import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useViewMode } from '@/app/provider';
import { PATHS } from '@/app/paths';
import { ROLES } from '@/features/auth/types/auth';

/**
 * guard route that checks if the user is NOT authenticated before allowing access to the page.
 * This is useful for pages like login and register, where it doesn't make sense to show them to logged-in users.
 * @param children the page component to render if access is granted
 * @returns the children if the user is NOT authenticated, otherwise redirects to /profile
 */

export const GuestOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const { paths } = useViewMode();

  if (isSessionLoading) return <RotatingLoader fullScreen label="Checking session..." />;

  if (!isAuthenticated) return children;
    
  //  get the correct redirect path based on user role
  let redirectPath;
  switch (user?.role) {
    case ROLES.VOYAGER:
      redirectPath=PATHS.VOYAGER.TICKETS;
      break;
    case ROLES.ADMIN:
      redirectPath=PATHS.ADMIN.DASHBOARD;
      break;
    case ROLES.AGENT:
      redirectPath=PATHS.AGENT.SUBSCRIPTION_REQUESTS;
      break;
    case ROLES.CONTROLLER:
      redirectPath=PATHS.ADMIN.PROFILE;
      break;
    default:
      redirectPath=paths.PROFILE;
  }


  return <Navigate to={redirectPath} replace />;
}