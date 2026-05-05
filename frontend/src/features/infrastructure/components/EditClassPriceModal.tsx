import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdateSeatClass } from '../api/use-infrastructure';
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
  priceIncreasePercentage: z.coerce.number().min(0, 'Le pourcentage ne peut pas être négatif'),
});

type FormValues = z.infer<typeof schema>;

interface EditClassPriceModalProps {
  trainId: string | null;
  seatClass: { id: string; type: string; price: number } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditClassPriceModal = ({ trainId, seatClass, isOpen, onClose }: EditClassPriceModalProps) => {
  const updateSeatClass = useUpdateSeatClass();
  const addNotification = useNotifications((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      priceIncreasePercentage: seatClass?.price || 0,
    },
  });

  React.useEffect(() => {
    if (isOpen && seatClass) {
      reset({
        priceIncreasePercentage: seatClass.price,
      });
    }
  }, [isOpen, seatClass, reset]);

  const onSubmit = (data: FormValues) => {
    if (!trainId || !seatClass) return;

    updateSeatClass.mutate(
      { trainId, classId: seatClass.id, data },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: `Prix de la classe ${seatClass.type} mis à jour`,
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Modifier le Prix</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="relative">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">
              Pourcentage de majoration (%)
            </Label>
            <div className="relative">
              <Input
                type="number"
                className="w-full text-lg h-12 rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-800 focus:ring-primary pl-4 pr-10 font-black text-slate-900 dark:text-white"
                {...register('priceIncreasePercentage')}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">%</span>
            </div>
            {errors.priceIncreasePercentage && (
              <p className="text-xs text-red-500 font-medium mt-1">{errors.priceIncreasePercentage.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-bold text-slate-500 uppercase tracking-wider text-xs">
              Annuler
            </Button>
            <Button type="submit" disabled={updateSeatClass.isPending} className="flex-1 font-bold bg-primary text-white uppercase tracking-wider text-xs shadow-lg shadow-primary/20">
              {updateSeatClass.isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
