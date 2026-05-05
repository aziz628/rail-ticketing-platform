export async function enableMocking() {

  // Only enable MSW if we are explicitly running in 'test' mode
  if (import.meta.env.MODE !== 'test') return;

  // Dynamically import the modules after env check (avoid unnecessary imports)
  const { initializeDb } = await import('./db');
  const { worker } = await import('./browser'); // browser.ts sets up the MSW worker with our auth handlers and exports it

  // Initialize the mock database and start the MSW worker before rendering the app
  await initializeDb();
  await worker.start({ onUnhandledRequest: 'warn' });
}