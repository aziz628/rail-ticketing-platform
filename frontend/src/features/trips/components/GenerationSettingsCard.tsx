import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/stores/notifications-store';
import { generationSettingsSchema, type GenerationSettingsFormValues } from '../schemas';
import { useTripSettingsQuery, useUpdateSettingsMutation, useSyncTripsMutation } from '../api/use-trips';
import { cn } from '@/lib/utils';

export function GenerationSettingsCard() {
  const addNotification = useNotifications((state) => state.addNotification);
  const { data: settings, isLoading } = useTripSettingsQuery();
  const updateSettingsMutation = useUpdateSettingsMutation();
  const syncTripsMutation = useSyncTripsMutation();

  const { control, handleSubmit, reset, watch } = useForm<GenerationSettingsFormValues>({
    resolver: zodResolver(generationSettingsSchema),
    defaultValues: {
      autoGenerateEnabled: false,
      generationSpanDays: 7,
    },
  });

  // Reactive values for the UI labels
  const autoEnabled = watch('autoGenerateEnabled');

  React.useEffect(() => {
    if (settings) {
      reset({
        autoGenerateEnabled: settings.autoGenerateEnabled,
        generationSpanDays: settings.generationSpanDays,
      });
    }
  }, [settings, reset]);

  const onUpdateSettings = async (values: GenerationSettingsFormValues) => {
    try {
      await updateSettingsMutation.mutateAsync(values);
      addNotification({ type: 'success', text: 'Paramètres mis à jour' });
    } catch (error: any) {
      if (!error._globallyHandled) {
        addNotification({
          type: 'error',
          text: error.response?.data?.message || 'Erreur lors de la mise à jour',
        });
      }
    }
  };

  const onManualSync = async () => {
    try {
      await syncTripsMutation.mutateAsync();
      addNotification({ type: 'success', text: 'Synchronisation terminée. Les voyages ont été mis à jour.' });
    } catch (error: any) {
      if (!error._globallyHandled) {
        addNotification({
          type: 'error',
          text: error.response?.data?.message || 'Erreur lors de la synchronisation',
        });
      }
    }
  };

  const spanItems = [
    { value: "7", label: "7 Jours (Standard)" },
    { value: "14", label: "14 Jours" },
    { value: "21", label: "21 Jours" },
    { value: "30", label: "30 Jours (Max)" },
  ];

  if (isLoading) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm animate-in fade-in duration-500">
      {/* label of settings */}
      <div className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
          <RefreshCw className={cn("h-4 w-4", (updateSettingsMutation.isPending || syncTripsMutation.isPending) && "animate-spin")} />
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight">Génération de Voyages</h3>
        </div>
      </div>

      {/*  Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-1 md:mt-0">
        {/* Generation span select */}
        <Controller
          control={control}
          name="generationSpanDays"
          render={({ field }) => (
            <Select
              value={String(field.value)}
              onValueChange={(val) => {
                if (val) {
                  const numVal = parseInt(val);
                  field.onChange(numVal);
                  handleSubmit(onUpdateSettings)();
                }
              }}
              items={spanItems}
            >
              <SelectTrigger className="h-9 w-[180px] bg-white text-blue-900 border-blue-200 text-xs font-bold rounded-lg shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spanItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* Auto-generate toggle */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 shadow-sm">
          <Controller
            control={control}
            name="autoGenerateEnabled"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  handleSubmit(onUpdateSettings)();
                }}
              />
            )}
          />
          <span className="text-[10px] font-black text-blue-800 dark:text-blue-200 uppercase tracking-wider">
            Auto-Gen {autoEnabled ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Manual Sync */}
        <Button
          variant="outline"
          size="sm"
          onClick={onManualSync}
          disabled={syncTripsMutation.isPending}
          className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg h-9 gap-2 md:ml-2 shadow-sm"
        >
          {syncTripsMutation.isPending ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3 fill-current" />
          )}
          Sync Now
        </Button>
      </div>
    </div>
  );
}
