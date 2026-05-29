import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Select, selectItemsGenerator,SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reassignControllerSchema, type ReassignControllerFormValues } from '../schemas';
import { useControllers } from '@/features/staff/api/use-staff';
import { useReassignControllerMutation } from '../api/schedules';
import { useNotifications } from '@/stores/notifications-store';
import type { Schedule } from '../types';
import type { Controller } from '@/features/staff/types';

interface ReassignControllerModalProps {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReassignControllerModal({ schedule, isOpen, onClose }: ReassignControllerModalProps) {
  const { addNotification } = useNotifications();
  const reassignMutation = useReassignControllerMutation();
  const { data: controllersData } = useControllers();
  const controllers = React.useMemo(() => 
    controllersData?.pages.flatMap(p => p.content) || [],
  [controllersData]);
  
  const controllerSelectItems = selectItemsGenerator<Controller>(controllers);

  const {
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReassignControllerFormValues>({
    resolver: zodResolver(reassignControllerSchema),
    defaultValues: {
      controllerId:"",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (values: ReassignControllerFormValues) => {
    if (!schedule) return;

    reassignMutation.mutate(
      { scheduleId: schedule.id, data: values },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: 'Contrôleur réassigné avec succès',
          });
          onClose();
        },
        onError: (error: any) => {
          if (!error._globallyHandled) {
            addNotification({
              type: 'error',
              text: error.response?.data?.message || 'Erreur lors de la réassignation',
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
          <DialogTitle className="sncft-modal-title">Réassigner le contrôleur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nouveau contrôleur</Label>
            <Select items={controllerSelectItems} onValueChange={(val) => setValue('controllerId', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un contrôleur" />
              </SelectTrigger>
              <SelectContent>
                {controllers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.controllerId && <p className="text-xs text-red-500">{errors.controllerId.message}</p>}
            {errors.root && <p className="text-xs text-red-500">{errors.root.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={reassignMutation.isPending}>
              {reassignMutation.isPending ? 'Mise à jour...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
