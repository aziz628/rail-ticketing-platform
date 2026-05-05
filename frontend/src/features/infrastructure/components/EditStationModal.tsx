import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stationSchema } from '../schemas';
import { useUpdateStation } from '../api/use-infrastructure';
import type { Station } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/stores/notifications-store';

interface EditStationModalProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
}

type StationFormValues = {
  name: string;
};

export const EditStationModal = ({ station, isOpen, onClose }: EditStationModalProps) => {
  const updateStation = useUpdateStation();
  const addNotification = useNotifications((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationSchema),
  });

  // Sync form with station data when modal opens
  React.useEffect(() => {
    if (isOpen && station) {
      reset({ name: station.name });
    }
  }, [isOpen, station, reset]);

  const onSubmit = (data: StationFormValues) => {
    if (!station) return;

    updateStation.mutate(
      { id: station.id, data },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: 'La gare a été mise à jour avec succès',
          });
          onClose();
        },
        onError: (error: any) => {
          if (!error._globallyHandled) {
            addNotification({
              type: 'error',
              text: error.response?.data?.message || 'Erreur lors de la mise à jour',
            });
          }
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la gare</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom de la gare</Label>
            <Input
              id="edit-name"
              placeholder="Ex: Tunis Ville"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs font-medium text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateStation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateStation.isPending}>
              {updateStation.isPending ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
