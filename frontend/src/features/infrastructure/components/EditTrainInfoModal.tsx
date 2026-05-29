import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdateTrain } from '../api/use-infrastructure';
import type { Train } from '../types';
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

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  basePriceIncreasePercentage: z.coerce.number().min(0, 'Le pourcentage ne peut pas être négatif'),
});

type FormValues = z.infer<typeof schema>;

interface EditTrainInfoModalProps {
  train: Train | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTrainInfoModal = ({ train, isOpen, onClose }: EditTrainInfoModalProps) => {
  const updateTrain = useUpdateTrain();
  const addNotification = useNotifications((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: train?.name || '',
      basePriceIncreasePercentage: train?.basePriceIncreasePercentage || 0,
    },
  });

  React.useEffect(() => {
    if (isOpen && train) {
      reset({
        name: train.name,
        basePriceIncreasePercentage: train.basePriceIncreasePercentage,
      });
    }
  }, [isOpen, train, reset]);

  const onSubmit = (data: FormValues) => {
    if (!train) return;

    updateTrain.mutate(
      { id: train.id, data },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: 'Le train a été mis à jour avec succès',
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
      <DialogContent className="sncft-modal-small">
        <DialogHeader>
          <DialogTitle className="sncft-modal-title">Informations du Train</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Nom du modèle
            </Label>
            <Input
              placeholder="Ex: Standard Express"
              className="bg-slate-50 dark:bg-slate-800"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Majoration de base (%)
            </Label>
            <Input
              type="number"
              placeholder="0"
              className="bg-slate-50 dark:bg-slate-800"
              {...register('basePriceIncreasePercentage')}
            />
            {errors.basePriceIncreasePercentage && (
              <p className="text-xs text-red-500 font-medium">{errors.basePriceIncreasePercentage.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-bold text-slate-500">
              Annuler
            </Button>
            <Button type="submit" disabled={updateTrain.isPending} className="flex-1 font-bold">
              {updateTrain.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
