import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth';
import type { UserRole } from '@/features/auth/types/auth';
import { useViewMode } from '../provider';


/**
 * guard route that checks if the user has one of the allowed roles to access the page.
 * @param children the page component to render if access is granted
 * @returns the children if the user has the required role, otherwise redirects to /login
 */
export const RoleRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) => {
  const { user } = useAuthStore();
  const userRole = user?.role;
  const { paths } = useViewMode();

  return userRole && allowedRoles.includes(userRole) ? (
    children
  ) : (
    <Navigate to={paths.LOGIN} replace />
  );
};