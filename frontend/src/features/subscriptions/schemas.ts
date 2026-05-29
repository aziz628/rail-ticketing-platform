import { z } from 'zod';
import type { SubscriptionCategoryCode, SubscriptionDuration } from './types/subscriptions';

export const SUBSCRIPTION_PROOF_ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;
export const SUBSCRIPTION_PROOF_ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'] as const;
export const SUBSCRIPTION_PROOF_MAX_SIZE = 5 * 1024 * 1024;

const proofFileSchema = z
  .instanceof(File, { message: 'Veuillez joindre le document requis' })
  .superRefine((file, ctx) => {
    if (file.size > SUBSCRIPTION_PROOF_MAX_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le fichier dépasse la limite autorisée de 5 Mo',
      });
    }

    const mimeType = file.type.toLowerCase();
    if (!SUBSCRIPTION_PROOF_ALLOWED_MIME_TYPES.includes(mimeType as typeof SUBSCRIPTION_PROOF_ALLOWED_MIME_TYPES[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format de fichier non supporté. Types autorisés : PDF, PNG, JPG, JPEG',
      });
    }
  });

export const subscriptionCategorySchema = z.object({
  monthlyPrice: z.number().min(0, "Le prix doit être positif"),
  quarterlyPrice: z.number().min(0, "Le prix doit être positif"),
});

export type SubscriptionCategoryFormValues = z.infer<typeof subscriptionCategorySchema>;

export const subscriptionRequestSchema = z.object({
  categoryName: z.enum(['SCOLAIRE', 'UNIVERSITAIRE', 'PROFESSIONNEL', 'CIVIL']),
  duration: z.enum(['MONTHLY', 'QUARTERLY']),
  lineId: z.string().min(1, 'Veuillez choisir une ligne'),
  proofFile: proofFileSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.categoryName !== 'CIVIL' && !data.proofFile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['proofFile'],
      message: 'Veuillez joindre le document requis',
    });
  }
});

export type SubscriptionRequestFormValues = {
  categoryName: SubscriptionCategoryCode;
  duration: SubscriptionDuration;
  lineId: string;
  proofFile?: File;
};
