import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { subscriptionCategorySchema, type SubscriptionCategoryFormValues } from '../schemas';
import type { SubscriptionCategoryResponse } from '../types/subscriptions';
import { SUBSCRIPTION_CATEGORY_LABELS } from '../constants/translations';
import { Loader2 } from 'lucide-react';

interface EditCategoryModalProps {
  category: SubscriptionCategoryResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubscriptionCategoryFormValues) => void;
  isLoading: boolean;
}

export const EditCategoryModal = ({ 
  category, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: EditCategoryModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscriptionCategoryFormValues>({
    resolver: zodResolver(subscriptionCategorySchema),
  });

  React.useEffect(() => {
    if (category) {
      reset({
        monthlyPrice: category.monthlyPrice,
        quarterlyPrice: category.quarterlyPrice,
      });
    }
  }, [category, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sncft-modal-medium">
        <DialogHeader>
          <DialogTitle className="sncft-modal-title">
            Modifier les tarifs - {category ? SUBSCRIPTION_CATEGORY_LABELS[category.name] : ''}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 pb-1">
          <div className="space-y-2">
            <Label htmlFor="monthlyPrice" className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Tarif mensuel (DT)
            </Label>
            <Input
              id="monthlyPrice"
              type="number"
              step="0.01"
              {...register('monthlyPrice', { valueAsNumber: true })}
              className={errors.monthlyPrice ? 'border-red-500' : 'bg-slate-50 dark:bg-slate-800'}
            />
            {errors.monthlyPrice && (
              <p className="text-xs text-red-500 font-medium">{errors.monthlyPrice.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quarterlyPrice" className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Tarif trimestriel (DT)
            </Label>
            <Input
              id="quarterlyPrice"
              type="number"
              step="0.01"
              {...register('quarterlyPrice', { valueAsNumber: true })}
              className={errors.quarterlyPrice ? 'border-red-500' : 'bg-slate-50 dark:bg-slate-800'}
            />
            {errors.quarterlyPrice && (
              <p className="text-xs text-red-500 font-medium">{errors.quarterlyPrice.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
