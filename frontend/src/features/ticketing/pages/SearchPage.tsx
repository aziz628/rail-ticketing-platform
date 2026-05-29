import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Route, Circle } from 'lucide-react';
import { PATHS } from '@/app/paths';
import { useLines } from '@/features/infrastructure/api/use-infrastructure';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, selectItemsGenerator } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { GuestLayout } from '@/components/layouts/GuestLayout';
import { cn } from '@/lib/utils';

type SearchFormValues = {
  lineId: string;
  from: string;
  to: string;
  date: string;
};

export const SearchPage = () => {
  const navigate = useNavigate();
  const { data: linesData, isLoading: isLoadingLines } = useLines();
  
  const lines = React.useMemo(() => 
    linesData?.pages.flatMap(page => page.content) || []
  , [linesData]);

  const { handleSubmit, watch, setValue, control, formState: { errors } } = useForm<SearchFormValues>({
    defaultValues: {
      lineId: '',
      from: '',
      to: '',
      date: new Date().toISOString().split('T')[0],
    }
  });

  const selectedLineId = watch('lineId');
  
  const availableStations = React.useMemo(() => {
    const line = lines.find(l => l.id === selectedLineId);
    return line?.nodes || [];
  }, [selectedLineId, lines]);

  // Preparing items for the Select components
  const lineItems = selectItemsGenerator(lines);
  const stationItems = selectItemsGenerator(availableStations.map(n => ({ id: n.id, name: n.stationName })));

  // Reset station selections when line changes
  React.useEffect(() => {
    setValue('from', '');
    setValue('to', '');
  }, [selectedLineId, setValue]);

  const onSubmit = (values: SearchFormValues) => {
    const params = new URLSearchParams({
      lineId: values.lineId,
      from: values.from,
      to: values.to,
      date: values.date,
    });
    navigate(`${PATHS.VOYAGER.RESULTS}?${params.toString()}`);
  };

  return (
    <GuestLayout>
      <div className="w-full max-w-3xl mx-auto  px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="sncft-page-title">
              Planifiez votre voyage
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Line Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
                Ligne
              </Label>
              <Controller
                name="lineId"
                control={control}
                rules={{ required: "Veuillez choisir une ligne" }}
                render={({ field }) => (
                  <div className="relative">
                    <Route className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
                    <Select
                      items={lineItems}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-14 pl-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 font-medium">
                        <SelectValue placeholder={isLoadingLines ? "Chargement..." : "Choisir une ligne"} />
                      </SelectTrigger>
                      <SelectContent>
                        {lines.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {errors.lineId && <p className="text-xs text-red-500 pl-1">{errors.lineId.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure Station */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
                  Départ
                </Label>
                <Controller
                  name="from"
                  control={control}
                  rules={{ required: "Gare de départ requise" }}
                  render={({ field }) => (
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
                      <Select
                        items={stationItems}
                        disabled={!selectedLineId}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className={cn(
                          "h-14 pl-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 font-medium",
                          !selectedLineId && "opacity-50"
                        )}>
                          <SelectValue placeholder="Départ" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStations.map((node) => (
                            <SelectItem key={node.id} value={node.id}>{node.stationName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>

              {/* Arrival Station */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
                  Arrivée
                </Label>
                <Controller
                  name="to"
                  control={control}
                  rules={{ required: "Gare d'arrivée requise" }}
                  render={({ field }) => (
                    <div className="relative">
                      <Circle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
                      <Select
                        items={stationItems}
                        disabled={!selectedLineId}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className={cn(
                          "h-14 pl-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 font-medium",
                          !selectedLineId && "opacity-50"
                        )}>
                          <SelectValue placeholder="Arrivée" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStations.map((node) => (
                            <SelectItem key={node.id} value={node.id}>{node.stationName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Same Station Warning */}
            {watch('from') && watch('to') && watch('from') === watch('to') && (
              <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                Les gares de départ et d'arrivée ne peuvent pas être identiques.
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
                Date de départ
              </Label>
              <Controller
                control={control}
                name="date"
                rules={{ required: "Date requise" }}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                )}
              />
              {errors.date && <p className="text-xs text-red-500 pl-1">{errors.date.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={!selectedLineId || !watch('from') || !watch('to') || watch('from') === watch('to')}
              className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              <Search className="h-5 w-5" />
              Rechercher des trajets
            </Button>
          </form>
        </div>
      </div>
    </GuestLayout>
  );
};
