import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus,  X } from 'lucide-react';
import { lineSchema } from '../schemas';
import { useCreateLine, useStations } from '../api/use-infrastructure';
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
import { z } from 'zod';

type LineFormValues = z.infer<typeof lineSchema>;

interface CreateLineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLineModal = ({ isOpen, onClose }: CreateLineModalProps) => {
  const createLine = useCreateLine();
  const { data: stationsData } = useStations();
  const addNotification = useNotifications((state) => state.addNotification);

  // flatmap to get all stations in a single array
  const stations = React.useMemo(() => {
    return stationsData?.pages.flatMap((page) => page.content) || [];
  }, [stationsData]);

  // use react hook form for form handling and zod resolver for presubmit validation
  const {
    register,
    control, // control is a param used by useFieldArray to manage the field array state of nodes
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(lineSchema),
    defaultValues: {
      name: '',
      createReverse: true,
      nodes: [
        // set ids to first default values
        { stationId: stations[0]?.id, kmFromSource: 0 }, // Source
        { stationId: stations[1]?.id, kmFromSource: 10 }, // Destination (10 as reasonable default)
      ],
    },
  });

  // use field array to dynamically add/remove intermediate stations in nodes array
  const { fields, insert, remove } = useFieldArray({
    control,
    name: 'nodes', // the field array name is nodes from schema
  });

  // Watch selected station IDs to prevent adding more rows than available stations
  // watch detect changes in the field 
  const selectedStationIds = watch('nodes').map(n => n.stationId);
  const canAddIntermediate = stations.length > selectedStationIds.length;

  // Intermediate nodes are between index 0 and index last
  const addIntermediate = () => {
    if (!canAddIntermediate) return;
    const lastIndex = fields.length - 1;
    // Set default 0 KM as default value for kmFromSource
    insert(lastIndex, { stationId: '', kmFromSource: 0});
  };

  const onSubmit = (data: any) => {
    createLine.mutate(data as LineFormValues, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'La ligne a été créée avec succès',
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
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Créer une ligne stricte</DialogTitle>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Constructeur de séquence (Min. 2 gares)</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* name field */}
            <div className="space-y-2">
              <Label htmlFor="line-name">Nom de la ligne</Label>
              <Input 
                id="line-name" 
                placeholder="Ex: Tunis - Sousse" 
                {...register('name')}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200"
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
            </div>

            {/* stations sequence field */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Séquence des gares</Label>
              
              {/* errors display */}
              {(errors.nodes?.message || (errors.nodes as any)?.root?.message) && (
                <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded-lg text-center animate-in fade-in slide-in-from-top-1">
                  {errors.nodes?.message || (errors.nodes as any)?.root?.message}
                </p>
              )}
              <div className="space-y-3">
                {/* map stations */}
                {fields.map((field, index) => {
                  const isSource = index === 0;
                  const isDestination = index === fields.length - 1;
                  const isIntermediate = !isSource && !isDestination;

                  return (
                    <div key={field.id} className="relative group">
                      <div className="flex items-center gap-3">
                        {/* circle indicator */}
                        <div className="shrink-0 w-8 flex justify-center">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            isSource ? "bg-primary" : isDestination ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                          )} />
                        </div>

                        {/* select station and km field */}
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex gap-2">
                            <select
                              {...register(`nodes.${index}.stationId`)}
                              className={cn(
                                "flex-1 h-10 px-3 text-sm rounded-lg border bg-slate-50 dark:bg-slate-900 focus:ring-primary focus:border-primary outline-none transition-colors",
                                errors.nodes?.[index]?.stationId ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                              )}
                            >
                              <option value="">Sélectionner une gare...</option>
                              {stations.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>

                            {/* km field */}
                            {!isSource && (
                              <div className="relative w-24">
                                <Input
                                  type="number"
                                  placeholder="KM"
                                  className={cn(
                                    "h-10 pr-7 text-xs font-bold",
                                    errors.nodes?.[index]?.kmFromSource && "border-red-500 focus-visible:ring-red-500"
                                  )}
                                  {...register(`nodes.${index}.kmFromSource`)}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">KM</span>
                              </div>
                            )}
                            
                            {/* base indicator */}
                            {isSource && (
                              <div className="w-24 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-400 uppercase border border-dashed border-slate-200">
                                Base
                              </div>
                            )}
                          </div>
                          
                          {(errors.nodes?.[index]?.stationId || errors.nodes?.[index]?.kmFromSource) && (
                            <p className="text-[10px] text-red-500 font-bold pl-1">
                              {errors.nodes?.[index]?.stationId?.message || errors.nodes?.[index]?.kmFromSource?.message}
                            </p>
                          )}
                        </div>

                        {/* delete button */}
                        {isIntermediate && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {(isSource || isDestination) && <div className="shrink-0 w-8" />}
                      </div>
                      
                      {/* Connector line */}
                      {index < fields.length - 1 && (
                        <div className="absolute left-[15px] top-8 w-0.5 h-4 bg-slate-100 dark:bg-slate-800" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* add intermediate button */}
              <div className="pl-11 pt-2">
                <button
                  type="button"
                  onClick={addIntermediate}
                  disabled={!canAddIntermediate}
                  className={cn(
                    "text-[11px] font-bold flex items-center gap-1.5 transition-all",
                    canAddIntermediate 
                      ? "text-primary hover:underline decoration-2 underline-offset-4" 
                      : "text-slate-300 cursor-not-allowed"
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {canAddIntermediate ? 'Ajouter une gare intermédiaire' : 'Toutes les gares sont utilisées'}
                </button>
              </div>
            </div>

            {/* create reverse checkbox */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-white">Ligne bidirectionnelle</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Créer automatiquement le trajet inverse</p>
              </div>

              <Checkbox 
                className="border-2  w-5 h-5 bg-white"
                checked={watch('createReverse')}
                onCheckedChange={(checked) => setValue('createReverse', !!checked)}
                aria-label="Créer la ligne inverse"
              />
            </div>

            
          </div>

          <DialogFooter className="p-6 pt-2 border-t border-slate-50 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={createLine.isPending} className="flex-1 font-bold text-slate-500">
              Annuler
            </Button>
            <Button type="submit" disabled={createLine.isPending} className="flex-1 font-bold shadow-md shadow-primary/20">
              {createLine.isPending ? 'Verrouillage...' : 'Verrouiller & Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
