import * as z from 'zod';

export const agentSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Format d\'e-mail invalide'),
});

export const controllerSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Format d\'e-mail invalide'),
  lineId: z.string().uuid('La ligne est invalide'),
});

export type AgentFormValues = z.infer<typeof agentSchema>;
export type ControllerFormValues = z.infer<typeof controllerSchema>;
