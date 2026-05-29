import { z } from 'zod';

export const generationSettingsSchema = z.object({
  autoGenerateEnabled: z.boolean(),
  generationSpanDays: z.number()
    .min(7, 'Le délai de génération doit être d\'au moins 7 jours')
    .max(30, 'Le délai de génération ne peut pas dépasser 30 jours'),
});

export type GenerationSettingsFormValues = z.infer<typeof generationSettingsSchema>;
