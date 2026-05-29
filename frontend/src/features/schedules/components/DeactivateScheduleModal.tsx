import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useDeactivateScheduleMutation } from '../api/schedules';
import { useNotifications } from '@/stores/notifications-store';
import { deactivateScheduleSchema, type DeactivateScheduleFormValues } from '../schemas';
import type { Schedule } from '../types';
import { AlertCircle } from 'lucide-react';

interface DeactivateScheduleModalProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeactivateScheduleModal({ schedule, isOpen, onClose }: DeactivateScheduleModalProps) {
  const addNotification = useNotifications((state) => state.addNotification);
  const deactivateMutation = useDeactivateScheduleMutation();

  // Apply dynamic refinement for schedule deactivation date min value
  const refinedSchema = React.useMemo(() => 
    deactivateScheduleSchema.refine(
      (data) => {
        if (!schedule?.minDeactivationDate) return true;
        return new Date(data.deactivationDate) >= new Date(schedule.minDeactivationDate);
      },
      { 
        message: `La date doit être supérieure ou égale au ${schedule?.minDeactivationDate}`,
        path: ['deactivationDate'] 
      }
    ), 
  [schedule]);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DeactivateScheduleFormValues>({
    resolver: zodResolver(refinedSchema),
  });

  // Reset form values when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset({
        deactivationDate: schedule?.minDeactivationDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, reset, schedule]);

  const onSubmit = (values: DeactivateScheduleFormValues) => {
    if (!schedule) return;

    deactivateMutation.mutate(
      { id: schedule.id, data: values },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: 'Horaire désactivé avec succès',
          });
          onClose();
        },
        onError: (error: any) => {
          if (!error._globallyHandled) {
            addNotification({
              type: 'error',
              text: error.response?.data?.message || 'Erreur lors de la désactivation',
            });
          }
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sncft-modal-medium">
        <DialogHeader>
          <DialogTitle className="sncft-modal-title flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Désactiver l'horaire
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">

          {/* Date Input Section */}
          <div className="space-y-2">
            <Label>Date de désactivation</Label>
            {/* RHF controller , allow to control the item states */ }
            <Controller
              control={control}
              name="deactivationDate"
              render={({ field }) => (
                <DatePicker
                  id="deactivate-date-input"
                  value={field.value}
                  minDate={schedule?.minDeactivationDate || undefined}
                  onChange={(value) => field.onChange(value ?? "")}
                />
              )}
            />
            {errors.deactivationDate && (
              <p className="text-xs text-red-500 font-medium">{errors.deactivationDate.message}</p>
            )}
            {errors.root && (
              <p className="text-xs text-red-500 font-medium">{errors.root.message}</p>
            )}
            {schedule?.minDeactivationDate && (
              <p className="text-[10px] text-slate-400">
                Date minimum autorisée  : {schedule.minDeactivationDate}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button 
              type="submit" 
              variant="deactivate"
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? 'Désactivation...' : 'Confirmer la désactivation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
