import { z } from 'zod';

const scheduleStopSchema = z.object({
  lineNodeId: z.string().min(1, 'La station est requise'),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'heure  invalide'),
});

export const createScheduleSchema = z.object({
  lineId: z.string().min(1, 'La ligne est requise'),
  trainId: z.string().min(1, 'Le train est requis'),
  controllerId: z.string().min(1, 'Le contrôleur est requis'),
  daysBitmask: z.string().regex(/^[01]{7}$/, 'jours invalide').refine((data) => data.includes('1'), 'au moins un jour actif'),
  activationDate: z.string().min(1, "La date d'activation est requise"),
  deactivationDate: z.string().optional().nullable(),
  stops: z.array(scheduleStopSchema).min(2, 'Une ligne doit avoir au moins 2 arrêts'),
}).refine(
  (data) => {
    //deactivation date must be after activation date and current date
    if (data.deactivationDate) {
      const act = new Date(data.activationDate);
      const deact = new Date(data.deactivationDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      return deact > act && deact > currentDate;
    }
    return true;
  },
  {
    message: "doit être supérieure à la date d'activation et à la date d'aujourd'hui",
    path: ['deactivationDate'],// path is obj key of invalid field 'deactivationDate'
  }
).refine(
  (data) => {
    //stops must be in incremental order by arrivalTime
    for (let i = 0; i < data.stops.length - 1; i++) {
      // make date object out of hh:mm string to compare them
      const stopArrivalTime1 = new Date(`1970-01-01T${data.stops[i].arrivalTime}`);
      const stopArrivalTime2 = new Date(`1970-01-01T${data.stops[i + 1].arrivalTime}`);
      if (stopArrivalTime1 >= stopArrivalTime2) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Les arrêts doivent être dans l'ordre croissant des heures d'arrivée",
    path: ['stops'],
  }
)

export type CreateScheduleFormValues = z.infer<typeof createScheduleSchema>;

export const reassignControllerSchema = z.object({
  controllerId: z.string().min(1, 'Veuillez sélectionner un contrôleur'),
});

export type ReassignControllerFormValues = z.infer<typeof reassignControllerSchema>;

export const deactivateScheduleSchema = z.object({
  deactivationDate: z.string().min(1, 'La date de désactivation est requise'),
});

export type DeactivateScheduleFormValues = z.infer<typeof deactivateScheduleSchema>;
