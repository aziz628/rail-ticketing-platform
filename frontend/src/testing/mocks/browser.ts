import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { infrastructureHandlers } from './handlers/infrastructure';
import { staffHandlers } from './handlers/staff';
import { schedulesHandlers } from './handlers/schedules';
import { tripsHandlers } from './handlers/trips';
import { ticketsHandlers } from './handlers/tickets';
import { subscriptionsHandlers } from './handlers/subscriptions';
import { dashboardHandlers } from './handlers/dashboard';

// Create an MSW worker with the defined request handlers
export const worker = setupWorker(
  ...authHandlers, 
  ...infrastructureHandlers, 
  ...staffHandlers,
  ...schedulesHandlers,
  ...tripsHandlers,
  ...ticketsHandlers,
  ...subscriptionsHandlers,
  ...dashboardHandlers
);