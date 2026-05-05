import { AppProvider } from './provider';
import { AppRouter } from './router';

/**
 * THE ROOT APPLICATION COMPONENT
 * 
 * this file separate from main.tsx?
 * `main.tsx` is strictly for DOM mounting (`createRoot`). 
 * `app.tsx` is where the actual React application begins. This separation 
 * a React community standard so testing tools can import `<App />` without accidentally triggering 
 * real DOM mounting.
 */

import { BrowserRouter } from 'react-router-dom';

export const App = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
};