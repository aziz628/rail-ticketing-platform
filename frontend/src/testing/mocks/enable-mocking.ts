export async function enableMocking() {

  // Only enable MSW if we are explicitly running in 'test' mode
  if (import.meta.env.MODE !== 'test') return;

 // sessionStorage key of DB
  const DB_INIT_KEY = 'msw-db-initialized';

  // initialize the DB once per browser session
  if (!sessionStorage.getItem(DB_INIT_KEY)) {
    const { initializeDb } = await import('./db');
    await initializeDb();
    // set db initialized flag
    sessionStorage.setItem(DB_INIT_KEY, '1');
  } else {
    // restore db from session storage after each page hard navigation , because the app will re-fetch and re-import everything which resets mockDb
    const { restoreMockDb } = await import('./db');
    restoreMockDb();
  }

  // Start the worker 
  const { worker } = await import('./browser');
  await worker.start({ onUnhandledRequest: 'warn' });
}