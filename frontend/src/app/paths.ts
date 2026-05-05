// Centralized route paths 
export const PATHS = {
  HOME: '/',
  
  // Voyager paths
  VOYAGER: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT: '/forgot-password',
    RESET: '/reset-password',
    PROFILE: '/profile',
    SEARCH: '/search',
    OFFERS: '/offers',
    TICKETS: '/tickets',
    SUBSCRIPTIONS: '/subscriptions',
  },

  // Staff paths
  STAFF: {
    LOGIN: '/staff/login',
    FORGOT: '/staff/forgot-password',
    RESET: '/staff/reset-password',
    PROFILE: '/staff/profile',
  }
  // Admin paths
  ,ADMIN: {
    LOGIN: '/staff/login',
    FORGOT: '/staff/forgot-password',
    RESET: '/staff/reset-password',
    PROFILE: '/staff/profile',
    DASHBOARD: '/staff/dashboard',
    STATIONS: '/staff/stations',
    TRAINS: '/staff/trains',
    LINES: '/staff/lines',
    STAFF: '/staff/management',
  }
} as const;

/**
 * Helper to determine if a pathname belongs to the staff area
 */
export const isStaffPath = (pathname: string) => pathname.startsWith('/staff');

export default PATHS;
