import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from './auth';
import { useAuthStore } from '@/stores/auth';
import { useNotifications } from '@/stores/notifications-store';
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
} from '../types/auth';


// keys used to identify the query and invalidate its cache
export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * Helper function to extract error message from error object of any API call
 * @param error the error object to extract the message from
 * @param fallback the fallback message to use if the error message cannot be extracted
 * @returns the error message
 */
export const getAuthErrorMessage = (error: unknown, fallback = 'an error occurred') => {
  // Check if the error has a 'response' property 
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as
      { response?: { data?: { message?: string } } }
    )
      .response;
    return response?.data?.message || fallback;
  }

  // Check if the error is an Error object
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // Return the fallback message if the error message cannot be extracted
  return fallback;
};



/**
 * hook for running the query getMe using react-query.
 * used on initial app load to check if the user has an active session by hitting the /me endpoint.
 * This is what we call auth state initialization.
 * @param enabled whether the query should run, 
 * we only want to run this on initial app load , so we control this with a flag in the auth store. 
 */
export const useMeQuery = (enabled = true) => {
  // react query run the api call and return states for loading, error, and data
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.getMe,
    retry: false,
    enabled,
  });
};

/**
 * hook for running the mutation loginClient that calls authApi.loginClient() using react-query.
 * used on login form submit to authenticate the user and log them in.
 * @param data the login credentials
 * @returns The react-query mutation object 
 * mutation use query client for storing the user data in the react-query cache
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient(); // get the query client who manage the react-query state and cache
  const setAuth = useAuthStore((s) => s.setAuth); // get the auth setter from authstore
  const addNotification = useNotifications((s) => s.addNotification); // get the notification setter 

  // use mutation  offers over react query the ability to run side effects on success and error
  return useMutation({
    mutationFn: (data: AuthLoginRequest) => authApi.loginClient(data), // api call function
    // On successful api call response, store the user data in the auth store and update the 'me' query cache
    onSuccess: (user) => {
      setAuth(user); 
      queryClient.setQueryData(authKeys.me, user); // update the react-query cache with the user data
      addNotification({
        type: 'success',
        text: 'Connexion réussie.',
      });
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: (data: AuthRegisterRequest) => authApi.registerClient(data),
    onSuccess: (user) => {
      setAuth(user);
      queryClient.setQueryData(authKeys.me, user);
      addNotification({
        type: 'success',
        text: 'Compte créé avec succès.',
      });
    },
  });
};

export const useForgotPasswordMutation = () => {
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: (response) => {
      addNotification({
        type: 'success',
        text: response.message || 'Code de réinitialisation envoyé. Vérifiez votre boîte de réception.',
      });
    },
  });
};

export const useResetPasswordMutation = () => {
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: (response) => {
      addNotification({
        type: 'success',
        text: response.message || 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.',
      });
    },
  });
};

export const useChangePasswordMutation = () => {
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: (response) => {
      addNotification({
        type: 'success',
        text: response.message || 'Votre mot de passe a été modifié avec succès.',
      });
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      // on logout remove all queries don't leave a single cached data of the previous logged in user
      queryClient.removeQueries({ queryKey: authKeys.me });
      addNotification({
        type: 'success',
        text: 'Vous avez été déconnecté avec succès.',
      });
    },
  });
};

export const useStaffLoginMutation = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: (data: AuthLoginRequest) => authApi.staffLogin(data),
    onSuccess: (user) => {
      setAuth(user);
      queryClient.setQueryData(authKeys.me, user);
      addNotification({
        type: 'success',
        text: 'Connexion staff réussie.',
      });
    },
  });
};

export const useStaffForgotPasswordMutation = () => {
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: (email: string) => authApi.staffForgotPassword(email),
    onSuccess: (response) => {
      addNotification({
        type: 'success',
        text: response.message || 'Code de réinitialisation staff envoyé.',
      });
    },
  });
};

export const useStaffResetPasswordMutation = () => {
  const addNotification = useNotifications((s) => s.addNotification);

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.staffResetPassword(data),
    onSuccess: (response) => {
      addNotification({
        type: 'success',
        text: response.message || 'Réinitialisation du mot de passe staff réussie.',
      });
    },
  });
};

