import * as React from 'react';
import { useForm, useFieldArray, Controller as RHFController } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, selectItemsGenerator, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createScheduleSchema, type CreateScheduleFormValues } from '../schemas';
import { useAllLines, useAllTrains } from '@/features/infrastructure/api/use-infrastructure';
import { useAllControllers } from '@/features/staff/api/use-staff';
import { useCreateScheduleMutation } from '../api/schedules';
import { useNotifications } from '@/stores/notifications-store';
import type { Line, Train } from "@/features/infrastructure/types/index";
import type { Controller as StaffController } from "@/features/staff/types/index";
import { cn } from '@/lib/utils';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Day labels matching bitmask positions (Mon=0 ... Sun=6)
const DAYS = [
  { label: 'Lun', value: 0 },
  { label: 'Mar', value: 1 },
  { label: 'Mer', value: 2 },
  { label: 'Jeu', value: 3 },
  { label: 'Ven', value: 4 },
  { label: 'Sam', value: 5 },
  { label: 'Dim', value: 6 },
];

export function CreateScheduleModal({ isOpen, onClose }: CreateScheduleModalProps) {
  const addNotification = useNotifications((state) => state.addNotification);
  const createMutation = useCreateScheduleMutation();

  const { data: lines = [] } = useAllLines();
  const { data: trains = [] } = useAllTrains();
  const { data: controllers = [] } = useAllControllers();

  // Generate select items from memoized data
  const linesItems = selectItemsGenerator<Line>(lines);
  const trainsItems = selectItemsGenerator<Train>(trains);
  const controllersItems = selectItemsGenerator<StaffController>(controllers);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateScheduleFormValues>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      lineId: '',
      trainId: '',
      controllerId: '',
      daysBitmask: '0000000',
      activationDate: new Date().toISOString().split('T')[0],// set default value of activationDate to today
      deactivationDate: null,
      stops: [],
    },
  });

  const { fields, replace, insert, remove } = useFieldArray({ control, name: 'stops' });
  const selectedLineId = watch('lineId');
  const daysBitmask = watch('daysBitmask');
  const activationDate = watch('activationDate');

  const minDeactivationDate = React.useMemo(() => {
    if (!activationDate) return undefined;
    const date = new Date(activationDate);
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }, [activationDate]);

  const selectedLine = React.useMemo(() => lines.find(l => l.id === selectedLineId), [lines, selectedLineId]);

  // Populate stop inputs when line selection changes
  React.useEffect(() => {
    if (selectedLine && selectedLine.nodes.length > 0) {
      // set default values for stops: only first and last node
      const firstNode = selectedLine.nodes[0];
      const lastNode = selectedLine.nodes[selectedLine.nodes.length - 1];
      
      replace([
        { lineNodeId: firstNode.id || '', arrivalTime: '' },
        { lineNodeId: lastNode.id || '', arrivalTime: '' }
      ]);
    } else {
      replace([]);
    }
  }, [selectedLine, replace]);

  const onSubmit = (values: CreateScheduleFormValues) => {
    createMutation.mutate(values as any, {
      onSuccess: () => {
        addNotification({ type: 'success', text: 'Horaire créé avec succès' });
        onClose();
        reset();
      },
      onError: (error: any) => {
        if (!error._globallyHandled) {
            addNotification({
            type: 'error',
            text: error.response?.data?.message || 'Une erreur est survenue lors de la création',
          });
        }
      },
    });
  };
  
  // toggle the day using Day index in the bitmask 
  const toggleDay = (index: number) => {
    const bits = daysBitmask.split('');
    bits[index] = bits[index] === '1' ? '0' : '1';
    // update the bitmask in the form 
    setValue('daysBitmask', bits.join(''), { shouldValidate: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sncft-modal-xl">
        <DialogHeader>
          <DialogTitle className="sncft-modal-title">Créer un horaire journalier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[calc(100vh-10rem)] overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Line & Train row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                {/* label for line */}
                <Label className="text-xs font-bold text-slate-500">Ligne cible</Label>
                <Select items={linesItems} onValueChange={(val) => setValue('lineId', val, { shouldValidate: true })}>
                  <SelectTrigger id="line-select">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.lineId && <p className="text-xs text-red-500">{errors.lineId.message}</p>}
              </div>
              
              {/* label for train */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Modèle de train</Label>
                <Select items={trainsItems} onValueChange={(val) => setValue('trainId', val, { shouldValidate: true })}>
                  <SelectTrigger id="train-select">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trains.map((train) => (
                      <SelectItem key={train.id} value={train.id}>{train.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.trainId && <p className="text-xs text-red-500">{errors.trainId.message}</p>}
              </div>
            </div>

            {/* Controller  default to first item */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500">Contrôleur assigné</Label>
              <Select
                items={controllersItems}
                onValueChange={(val) => setValue('controllerId', val, { shouldValidate: true })}
              >
                <SelectTrigger id="controller-select">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {controllers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.controllerId && <p className="text-xs text-red-500">{errors.controllerId.message}</p>}
            </div>

            {/* Day pill toggles  */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">Jours d'exploitation actifs</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isActive = daysBitmask[day.value] === '1';
                  return (
                    <label
                      key={day.value}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer border px-3 py-1.5 rounded-lg transition-colors",
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60 hover:opacity-100 hover:bg-slate-100"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                        checked={isActive}
                        onChange={() => toggleDay(day.value)}
                      />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{day.label}</span>
                    </label>
                  );
                })}
              </div>
              {errors.daysBitmask && <p className="text-xs text-red-500">{errors.daysBitmask.message}</p>}
            </div>

            {/* Dates row */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                {/* Activation date */ }
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500">Date d'activation</Label>
                  <RHFController
                    control={control}
                    name="activationDate"
                    render={({ field }) => (
                      <DatePicker
                        id="activation-date"
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? '')}
                      />
                    )}
                  />
                  <p className="text-[10px] text-slate-400">Par défaut: aujourd'hui.</p>
                  {errors.activationDate && <p className="text-xs text-red-500">{errors.activationDate.message}</p>}
                </div>

                {/* Deactivation date  */ }
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-500">Date de désactivation</Label>
                  {/* RHFController wraps the DatePicker component and to manage its state */ }
                  <RHFController
                    control={control}
                    name="deactivationDate"
                    render={({ field }) => (
                      <DatePicker
                        id="deactivation-date"
                        value={field.value}
                        minDate={minDeactivationDate}
                        allowClear
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <p className="text-[10px] text-slate-400">Laisser vide pour une durée indéfinie.</p>
                  {errors.deactivationDate && <p className="text-xs text-red-500">{errors.deactivationDate.message}</p>}
                </div>
              </div>
            </div>

            {/* Stop timetable  */}
            {selectedLine && selectedLine.nodes.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <Label className="text-xs font-bold text-slate-500">
                  Configurer les arrêts et horaires
                </Label>
                
                <div className="space-y-2">
                  {selectedLine.nodes.map((node, i) => {
                    const stopIndex = fields.findIndex(f => f.lineNodeId === node.id);
                    const isSelected = stopIndex !== -1;
                    const isFirstOrLast = i === 0 || i === selectedLine.nodes.length - 1;

                    return (
                      <div key={node.id || i} className="flex items-center gap-3">
                        <Checkbox
                          style={ // checkbox to make it look forced make it a bit grayed when it's one of the first or last node
                            isFirstOrLast ? { opacity: "30%" } : { opacity: "100%" }}
                          checked={isSelected}
                          disabled={isFirstOrLast}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // get the nodes before the current node
                              const nodesBefore = selectedLine.nodes.slice(0, i);
                              // check if all previous nodes from linenodes list are before in the form nodes field (avoid order break when toggled back and forth to fields)
                              const insertIndex = fields.filter(f => nodesBefore.some(n => n.id === f.lineNodeId)).length;
                              // insert node at stops array field at insertIndex
                              insert(insertIndex, {
                                lineNodeId: node.id || '',
                                arrivalTime: '',
                              });
                            } else if (!isFirstOrLast) {
                              remove(stopIndex);
                            }
                          }}
                        />
                        <span className={cn("text-sm font-bold w-24 shrink-0", isSelected ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500")}>
                          {node.stationName}
                        </span>
                        {isSelected && (
                          <div className="flex flex-col flex-1">
                            <Input
                              type="time"
                              {...register(`stops.${stopIndex}.arrivalTime` as const)}
                              className="w-full max-w-[120px] text-xs font-medium bg-slate-50 dark:bg-slate-800"
                            />
                            {errors.stops?.[stopIndex]?.arrivalTime?.message && (
                              <p className="text-xs text-red-500 mt-1">{errors.stops[stopIndex].arrivalTime.message}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* root message for stops  */}
                {errors.stops && <p className="text-xs text-red-500">{errors.stops?.message || errors.stops.root?.message}</p>}
              </div>
            )}
          </div>


          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1 primary-sncft">
              {createMutation.isPending ? 'Création...' : 'Créer l\'horaire'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
