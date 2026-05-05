import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useViewMode } from '@/app/provider';

/**
 * guard route that checks if the user is NOT authenticated before allowing access to the page.
 * This is useful for pages like login and register, where it doesn't make sense to show them to logged-in users.
 * @param children the page component to render if access is granted
 * @returns the children if the user is NOT authenticated, otherwise redirects to /profile
 */

export const GuestOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isSessionLoading } = useAuthStore();
  const { paths } = useViewMode();

  if (isSessionLoading) return <RotatingLoader fullScreen label="Checking session..." />;

  return !isAuthenticated ? children : <Navigate to={paths.PROFILE} replace />;
}