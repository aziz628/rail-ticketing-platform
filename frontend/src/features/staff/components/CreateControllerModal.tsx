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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  selectItemsGenerator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateController } from '../api/use-staff';
import { useAllLines } from '@/features/infrastructure/api/use-infrastructure';
import { useNotifications } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';
import type { Line } from '@/features/infrastructure/types';
import { controllerSchema, type ControllerFormValues } from '../schemas';

interface CreateControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateControllerModal = ({ isOpen, onClose }: CreateControllerModalProps) => {
  const createController = useCreateController();
  const { data: lines = [] } = useAllLines();
  const addNotification = useNotifications((state) => state.addNotification);

  const selectItems = selectItemsGenerator<Line>(lines);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ControllerFormValues>({
    resolver: zodResolver(controllerSchema),
    defaultValues: {
      name: '',
      email: '',
      lineId: selectItems[0]?.value || '',
    },
  });

  const onSubmit = (data: ControllerFormValues) => {
    createController.mutate(data, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'Contrôleur créé avec succès',
        });
        reset();
        onClose();
      },
      onError: (error: any) => {
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
      <DialogContent className="sncft-modal-medium">
        <DialogHeader>
          <DialogTitle className="sncft-modal-title">Créer un Contrôleur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="sncft-form-label">Nom complet</Label>
            <Input
              id="name"
              placeholder="Ex: Selma Ben Amor"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="sncft-form-error">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="sncft-form-label">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="selma.amor@sncft.tn"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="sncft-form-error">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lineId" className="sncft-form-label">Ligne assignée</Label>
            <Controller
              control={control}
              name="lineId"
              render={({ field }) => (
                // items prop is required by base-ui to options name
                <Select
                  items={selectItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='ligne selector' className={cn("w-full h-11", errors.lineId ? 'border-red-500' : '')}>
                    {/* set default value  */}
                    <SelectValue placeholder={selectItems[0]?.label || 'Sélectionner une ligne'} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.lineId && (
              <p className="text-xs font-medium text-red-500">{errors.lineId.message}</p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createController.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createController.isPending}>
              {createController.isPending ? 'Création...' : 'Créer le contrôleur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
