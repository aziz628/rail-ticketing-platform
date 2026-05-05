import { z } from 'zod';

export const stationSchema = z.object({
  name: z.string().min(1, 'Le nom de la gare est requis'),
});

export const seatClassSchema = z.object({
  enabled: z.boolean().default(true),
  type: z.enum(['FIRST', 'SECOND', 'COMFORT']),
  capacity: z.coerce.number().min(1, 'La capacité doit être au moins 1'),
  priceIncreasePercentage: z.coerce.number().min(0, 'Le pourcentage ne peut pas être négatif'),
});

export interface SeatClassFormValues {
  enabled: boolean;
  type: 'FIRST' | 'SECOND' | 'COMFORT';
  capacity: number;
  priceIncreasePercentage: number;
}

export const trainSchema = z.object({
  name: z.string().min(1, 'Le nom du train est requis'),
  basePriceIncreasePercentage: z.coerce.number().min(0, 'Le pourcentage ne peut pas être négatif'),
  seatClasses: z.array(seatClassSchema),
}).refine((data) => data.seatClasses.some((sc) => sc.enabled), {
  message: 'Veuillez activer au moins une classe de siège',
  path: ['seatClasses'],
});

export type TrainFormValues = z.infer<typeof trainSchema>;

export const lineNodeSchema = z.object({
  stationId: z.string().uuid('gare invalide'),
  kmFromSource: z.coerce.number().min(0, 'La distance ne peut pas être négative'),
});

export const lineSchema = z.object({
  name: z.string().min(1, 'Le nom de la ligne est requis'),
  nodes: z.array(lineNodeSchema).min(2, 'Une ligne doit avoir au moins deux gares'),
  createReverse: z.boolean().default(true),
}).refine((data) => {
  // Check for unique stations
  const stationIds = data.nodes.map(n => n.stationId);
  const uniqueStations = new Set(stationIds);
  return uniqueStations.size === stationIds.length;
}, {
  message: 'Chaque gare dans la séquence doit être unique',
  path: ['nodes'],
}).refine((data) => {
  // Check for incremental distances
  for (let i = 1; i < data.nodes.length; i++) {
    if (data.nodes[i].kmFromSource <= data.nodes[i-1].kmFromSource) {
      return false;
    }
  }
  return true;
}, {
  message: 'Les distances doivent être strictement croissantes',
  path: ['nodes'],
});
