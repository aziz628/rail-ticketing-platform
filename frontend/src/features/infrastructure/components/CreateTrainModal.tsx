import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Armchair } from 'lucide-react';
import { trainSchema, type TrainFormValues } from '../schemas';
import { useCreateTrain } from '../api/use-infrastructure';
import type { SeatClassType } from '../types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';

interface CreateTrainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CLASSES: SeatClassType[] = ['FIRST', 'SECOND', 'COMFORT'];

export const CreateTrainModal = ({ isOpen, onClose }: CreateTrainModalProps) => {
  const createTrain = useCreateTrain();
  const addNotification = useNotifications((state) => state.addNotification);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(trainSchema),
    defaultValues: {
      name: '',
      basePriceIncreasePercentage: 0,
      seatClasses: DEFAULT_CLASSES.map((type) => ({
        enabled: type === 'SECOND',
        type,
        capacity: 50,
        priceIncreasePercentage: type === 'FIRST' ? 20 : type === 'COMFORT' ? 30 : 0,
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'seatClasses',
  });

  const onSubmit = (data: TrainFormValues) => {
    // Filter only enabled classes for the API request
    const enabledClasses = data.seatClasses.filter((c) => c.enabled);
    
    createTrain.mutate(
      {
        name: data.name,
        basePriceIncreasePercentage: data.basePriceIncreasePercentage,
        seatClasses: enabledClasses.map(({ type, capacity, priceIncreasePercentage }) => ({
          type,
          capacity,
          priceIncreasePercentage,
        })),
      },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: 'Le train a été créé avec succès',
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
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouveau modèle de train</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* train name and base price increase percentage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="train-name">Nom du modèle</Label>
              <Input id="train-name" placeholder="Ex: Alstom Coradia" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-price">Majoration de base (%)</Label>
              <Input id="base-price" type="number" {...register('basePriceIncreasePercentage')} />
              {errors.basePriceIncreasePercentage && (
                <p className="text-xs text-red-500 font-medium">{errors.basePriceIncreasePercentage.message}</p>
              )}
            </div>
          </div>

          {/* train classes configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-900">Configuration des classes</Label>
              {/* Check both direct message and root message for array refinement */}
              {(errors.seatClasses?.message || (errors.seatClasses as any)?.root?.message) && (
                <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-bold animate-in fade-in slide-in-from-top-1">
                  {errors.seatClasses?.message || (errors.seatClasses as any)?.root?.message}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => {
                const isEnabled = watch(`seatClasses.${index}.enabled`);
                return (
                  <div
                    key={field.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all",
                      isEnabled 
                        ? "bg-white border-slate-200 shadow-sm" 
                        : "bg-slate-50/50 border-slate-100 opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={isEnabled}
                      onCheckedChange={(checked) => setValue(`seatClasses.${index}.enabled`, !!checked)}
                      aria-label={`Activer la classe ${field.type}`}
                    />
                    <div className="w-24 flex items-center gap-2">
                      <Armchair className={cn(
                        "h-4 w-4",
                        field.type === 'FIRST' ? "text-amber-500" : field.type === 'COMFORT' ? "text-purple-500" : "text-slate-400"
                      )} />
                      <span className="text-sm font-bold text-slate-900">{field.type}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-400 font-black">Capacité</Label>
                        <Input
                          type="number"
                          className={cn("h-9", errors.seatClasses?.[index]?.capacity && "border-red-500 focus-visible:ring-red-500")}
                          disabled={!isEnabled}
                          {...register(`seatClasses.${index}.capacity`)}
                        />
                        {errors.seatClasses?.[index]?.capacity && (
                          <p className="text-[10px] text-red-500 font-bold">{errors.seatClasses[index].capacity?.message}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-400 font-black">Majoration (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            className={cn("h-9 pr-7", errors.seatClasses?.[index]?.priceIncreasePercentage && "border-red-500 focus-visible:ring-red-500")}
                            disabled={!isEnabled}
                            {...register(`seatClasses.${index}.priceIncreasePercentage`)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">%</span>
                        </div>
                        {errors.seatClasses?.[index]?.priceIncreasePercentage && (
                          <p className="text-[10px] text-red-500 font-bold">{errors.seatClasses[index].priceIncreasePercentage?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createTrain.isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={createTrain.isPending}>
              {createTrain.isPending ? 'Création...' : 'Créer le train'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
