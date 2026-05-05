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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateController } from '../api/use-staff';
import { useLines } from '@/features/infrastructure/api/use-infrastructure';
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
  const { data: linesData } = useLines();
  const addNotification = useNotifications((state) => state.addNotification);

  const lines = React.useMemo(() => {
    return linesData?.pages.flatMap((page) => page.content) || [];
  }, [linesData]);

  const selectItems = React.useMemo(() => 
    lines.map((line: Line) => ({ value: line.id, label: line.name })),
    [lines]
  );

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
      lineId: '',
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Créer un Contrôleur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              placeholder="Ex: Selma Ben Amor"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-xs font-medium text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="selma.amor@sncft.tn"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lineId">Ligne assignée</Label>
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
                  <SelectTrigger className={cn("w-full h-11", errors.lineId ? 'border-red-500' : '')}>
                    <SelectValue placeholder="Sélectionner une ligne" />
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
