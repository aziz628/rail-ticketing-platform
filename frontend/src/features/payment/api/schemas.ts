import { z } from 'zod';

export const pspPaymentSchema = z.object({
  cardNumber: z.string()
    .min(19, 'Le numéro de carte doit comporter 16 chiffres') // 16 digits + 3 spaces
    .max(19),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Format invalide (MM/YY)')
    .refine((val) => {
      const [month, year] = val.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      
      if (year < currentYear) return false;
      if (year === currentYear && month < currentMonth) return false;
      return true;
    }, 'La carte est expirée'),
  cvv: z.string()
    .min(3, 'Le CVV doit comporter 3 ou 4 chiffres')
    .max(4, 'Le CVV doit comporter 3 ou 4 chiffres')
    .regex(/^[0-9]+$/, 'Doit contenir uniquement des chiffres'),
});

export type PspPaymentFormValues = z.infer<typeof pspPaymentSchema>;
