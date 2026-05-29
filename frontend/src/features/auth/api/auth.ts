// defines API functions for authentication-related operations, 
// such as registration, login, logout, and password management.
// It uses a shared API client to make HTTP requests to the backend 
// and defines the expected request and response types for each operation.

import { api } from '@/lib/api-client';
import type {
  AuthUser,
  AuthRegisterRequest,
  AuthLoginRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '../types/auth';


export const authApi = {
  registerClient: async (data: AuthRegisterRequest) => {
    const response = await api.post<AuthUser>('/auth/register', data, { _silent: true });// silent so we handle notifs in page component instead of global api client 
    return response.data;
  },

  loginClient: async (data: AuthLoginRequest) => {
    const response = await api.post<AuthUser>('/auth/login', data, { _silent: true });
    return response.data;
  },

  logout: async () => {
    await api.post<void>('/auth/logout', {}, { _silent: true });
  },

  getMe: async () => {
    const response = await api.get<AuthUser>('/users/me', { _silent: true });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email }, { _silent: true });
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await api.post<{ message: string }>('/auth/reset-password', data, { _silent: true });
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.patch<{ message: string }>('/users/me', data, { _silent: true });
    return response.data;
  },

  staffLogin: async (data: AuthLoginRequest) => {
    const response = await api.post<AuthUser>('/auth/staff/login', data, { _silent: true });
    return response.data;
  },

  staffForgotPassword: async (email: string) => {
    const response = await api.post<{ message: string }>('/auth/staff/forgot-password', { email }, { _silent: true });
    return response.data;
  },

  staffResetPassword: async (data: ResetPasswordRequest) => {
    const response = await api.post<{ message: string }>('/auth/staff/reset-password', data, { _silent: true });
    return response.data;
  },
};