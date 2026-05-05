import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth';
import type { UserRole } from '@/features/auth/types/auth';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useViewMode } from '@/app/provider';
import PATHS from '../paths';
/**
 * guard route that checks if the user is authenticated and has the correct role 
 * before allowing access to the page.
 */
export const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) => {
  const { isAuthenticated, user, isSessionLoading } = useAuthStore();
  const { paths } = useViewMode();

  if (isSessionLoading) return <RotatingLoader fullScreen label="Checking session..." />;

  if (!isAuthenticated) {
    return <Navigate to={paths.LOGIN} replace />;
  }

  // redirect unallowed users to their default home 
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // use user role to get his profile    
    const userPath = user.role === 'VOYAGER' ? PATHS.VOYAGER.PROFILE : PATHS.ADMIN.PROFILE;
    return <Navigate to={userPath} replace />;
  }

  return children;
};