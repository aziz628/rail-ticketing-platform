import { createRoot } from 'react-dom/client'
import { App } from './app/app'
import './index.css' // Your Tailwind & SNCFT theme variables
import { enableMocking } from './testing/mocks/enable-mocking'

/**
 * THE RENDER ENTRY POINT (Vite's Root)
 * 
 * What it does:
 * Bootstraps React directly into the `index.html` #root DOM element.
 * It does nothing else. All React logic is delegated to the <App /> component.
 * 
 * enableMocking() is an async function that sets up the MSW worker for API mocking in E2E tests. 
 * We call it here to ensure the worker because the worker needs to be active before any API calls are made
 */
void enableMocking().then(() => {
    // Now that mocking is enabled, we can safely render the React application.
    createRoot(document.getElementById('root')!)
    .render(<App />)
})
