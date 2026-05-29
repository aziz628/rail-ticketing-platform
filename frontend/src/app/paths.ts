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
    RESULTS: '/search-results',
    TRIP_DETAILS: '/trips',
    OFFERS: '/offers',
    SUBSCRIPTION_REQUEST: '/subscriptions/request',
    TICKETS: '/tickets',
    SUBSCRIPTIONS: '/subscriptions',
    PAYMENT: '/payment', // pspSessionId manualy added when using navigate() , already added ":id" to react router path   
    PAYMENT_SUCCESS: '/payment/success',
    PAYMENT_FAILED: '/payment/failed',
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
    SCHEDULES: '/staff/schedules',
    TRIPS: '/staff/trips',
    SUBSCRIPTIONS: '/staff/subscriptions',
  }

  // agent paths
  ,AGENT: {
    SUBSCRIPTION_REQUESTS: '/staff/subscription-requests',
  }
} as const;

/**
 * Helper to determine if a pathname belongs to the staff area
 */
export const isStaffPath = (pathname: string) => pathname.startsWith('/staff');

export default PATHS;
