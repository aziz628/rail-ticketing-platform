import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer un email valide' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer un email valide' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  nationalIdNumber: z.string().regex(/^(.{8}|.{12})$/, { message: 'Veuillez entrer un numéro d\'identité valide' }),
  nationalIdType: z.string().regex(/^(CIN|BIRTH_CERT)$/, { message: 'Veuillez sélectionner un type d\'identité' }),
  confirmPassword: z.string().min(8, { message: 'La confirmation du mot de passe est requise' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer un email valide' }),
});

export const resetPasswordSchema = z.object({
  otp: z.string().length(8, { message: 'Veuillez entrer le code à 8 chiffres' }),
  newPassword: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  confirmPassword: z.string().min(8, { message: 'La confirmation du mot de passe est requise' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  newPassword: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  confirmPassword: z.string().min(8, { message: 'La confirmation du mot de passe est requise' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
