import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/auth';
import { infrastructureHandlers } from './handlers/infrastructure';
import { staffHandlers } from './handlers/staff';

// Create an MSW worker with the defined request handlers
export const worker = setupWorker(
  ...authHandlers, 
  ...infrastructureHandlers, 
  ...staffHandlers
);