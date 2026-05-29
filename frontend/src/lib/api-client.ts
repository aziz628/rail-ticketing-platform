import Axios, { type InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios';
import { useNotifications } from '@/stores/notifications-store';
import { PATHS, isStaffPath } from '@/app/paths';

// Extend Axios types to support a configured silent flag 
declare module 'axios' {
  export interface AxiosRequestConfig {
    _silent?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    _silent?: boolean;
  }
  export interface AxiosError {
    _globallyHandled?: boolean;
  }
}

/**
 * api Error message extraction for notifications added by interceptor
 * 
 * @param error - The error object.
 * @returns The error message.
 */
function getErrorMessage(error: unknown) {
  if (Axios.isAxiosError(error)) {
    // If the backend sent a specific message, always prioritize it
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Translate common Axios network errors into French fallbacks
    if (error.code === 'ERR_NETWORK') {
      return 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Le délai de la requête a expiré.';
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Une erreur interne est survenue sur le serveur.';
    }

    // Fallback if Axios gives an English message we didn't catch
    return error.message || 'Une erreur inattendue est survenue.';
  }
  
  if (error instanceof Error) {
    return error.message || 'Une erreur inattendue est survenue.';
  }

  return 'Une erreur inattendue est survenue.';
}

/**
 * HTTP CLIENT CONFIGURATION 
 * Every single API request to your Spring Boot backend must go through this `api` instance.
 * Instead of writing `axios.get('...url...')` in 50 different places, we configure it once.
 */
function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
    
    // E2E Test Injection: If msw is enabled and a session is set in localStorage, 
    // we send it as a header because Service Workers (MSW) cannot read Cookies.
    if (import.meta.env.VITE_ENABLE_MSW === 'true') {
      const mockSession = localStorage.getItem('x-mock-session');
      if (mockSession) {
        config.headers['x-mock-session'] = mockSession;
      }
    }
  }
  
  config.withCredentials = true;
  return config;
}

// Interceptor to handle the custom _silent flag for requests
// If a request has _silent: true, global error notifications will be skipped.
function isSilentRequest(config?: AxiosRequestConfig | InternalAxiosRequestConfig) {
  return !!config?._silent;
}

// Create the global Axios instance for api calls
export const api = Axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Uses the Vite proxy in development; env override can point elsewhere.
});

// The Interceptors: Middlewares that run before sending and after receiving data
api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const silent = isSilentRequest(error.config);

    // If download endpoint got an error, and  the response type is set a Blob
    // we  parse it as JSON to get the actual error message.
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text);
      } catch (e) {
        // Not a JSON blob
      }
    }

    const isValidationError = status === 400 || status === 422;

    // show api error for all request except unauthenticated, validation errors and silent requests
    if (!silent && status !== 401 && !isValidationError) {
      useNotifications.getState().addNotification({
        type: 'error',
        text: getErrorMessage(error), // show user friendly errors
      });
      error._globallyHandled = true; // Mark as handled to prevent double-toasting in components
    }

    // if Unauthorized force log the user out since session expired
    if (status === 401 && !silent) {
      window.location.href = isStaffPath(window.location.pathname) ? PATHS.STAFF.LOGIN : PATHS.VOYAGER.LOGIN;
      error._globallyHandled = true;
    }

    return Promise.reject(error);
  },
);