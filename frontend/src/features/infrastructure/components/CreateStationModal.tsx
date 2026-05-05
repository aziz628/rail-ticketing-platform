import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stationSchema } from '../schemas';
import { useCreateStation } from '../api/use-infrastructure';
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

interface CreateStationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateStationModal = ({ isOpen, onClose }: CreateStationModalProps) => {
  const createStation = useCreateStation();
  const addNotification = useNotifications((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = (data: { name: string }) => {
    createStation.mutate(data, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'La gare a été créée avec succès',
        });
        reset();
        onClose();
      },
      onError: (error: any) => {
        // If not globally handled by interceptor (e.g. 400/409 we want to handle locally)
        // Note: Our interceptor currently handles 409. If we want to override it, 
        if (!error._globallyHandled) {
          addNotification({
            type: 'error',
            text: error.response?.data?.message || 'Erreur lors de la création',
          });
        }
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle gare</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la gare</Label>
            <Input
              id="name"
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
              disabled={createStation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createStation.isPending}>
              {createStation.isPending ? 'Création...' : 'Créer la gare'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
