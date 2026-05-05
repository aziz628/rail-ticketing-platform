// This file defines TypeScript interfaces for authentication-related API requests and user models.

export type UserRole = 'VOYAGER' | 'ADMIN' | 'AGENT' | 'CONTROLLER';

export interface AuthUser {
  name: string;
  nationalIdType: string;
  nationalIdNumber: string;
  email: string;
  role: UserRole;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  nationalIdType: 'CIN' | 'BIRTH_CERT';
  nationalIdNumber: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}