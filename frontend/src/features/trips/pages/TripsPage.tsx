import * as React from 'react';
import { Filter } from 'lucide-react';
import { format } from 'date-fns';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { Card } from '@/components/ui/card';
import { Select, selectItemsGenerator, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuthStore } from '@/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { useLines } from '@/features/infrastructure/api/use-infrastructure';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';

import { TripsTable } from '../components/TripsTable';
import { GenerationSettingsCard } from '../components/GenerationSettingsCard';
import { useTripsQuery } from '../api/use-trips';

export function TripsPage() {
  const { user } = useAuthStore();
  const navItems = useNavigation();

  const [selectedLineId, setSelectedLineId] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // fetch all lines 
  const { data: linesData } = useLines();
  const lines = React.useMemo(() => linesData?.pages.flatMap(p => p.content) || [], [linesData]);
  // generate formatted items for select input
  const generatedItems = selectItemsGenerator(lines);
  // add "all lines" option
  const lineItems = React.useMemo(
    () => [{ value: "", label: "Toutes les lignes" }, ...generatedItems],
    [generatedItems]
  );

  // Fetch trips
  const tripsQuery = useTripsQuery({
    lineId: selectedLineId || undefined,
    date: selectedDate || undefined,
  });

  const trips = React.useMemo(
    () => tripsQuery.data?.pages.flatMap(p => p.content) || [],
    [tripsQuery.data]
  );

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content sncft-page-section">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="sncft-page-header">
            <h1 className="sncft-page-title">
              Gestion des Voyages
            </h1>
            <p className="sncft-page-subtitle">
              Supervisez les voyages générés en temps réel et les archives historiques.
            </p>
          </div>
        </div>

        {/* Generation Settings Card */}
        <GenerationSettingsCard />

        {/* Filters Section  */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Filter Icon Wrapper */}
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 h-12 flex items-center">
              <Filter className="h-4 w-4" />
            </div>  

            {/* Date Filter */}    
            <DatePicker
              id="trip-date-filter"
              value={selectedDate}
              onChange={(val) => setSelectedDate(val ?? format(new Date(), 'yyyy-MM-dd'))}
              allowClear={false}
            />

            {/* Line Filter */}
            <Select
              value={selectedLineId}
              onValueChange={setSelectedLineId}
              items={lineItems}
            >
              <SelectTrigger className="w-full md:w-[250px] h-12 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 rounded-xl">
                <SelectValue placeholder="Toutes les lignes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les lignes</SelectItem>
                {lines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Table Card */}
        <Card className="sncft-card overflow-hidden p-0">
          <TripsTable
            trips={trips}
            isLoading={tripsQuery.isLoading}
          />

          {/* Standard Load More Footer — matches StaffPage/SchedulesPage pattern */}
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Affichage de {trips.length} Voyages
            </p>
            <LoadMoreButton
              hasNextPage={tripsQuery.hasNextPage || false}
              isFetchingNextPage={tripsQuery.isFetchingNextPage}
              fetchNextPage={() => tripsQuery.fetchNextPage()}
              label="Afficher plus"
              className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
            />
          </div>
        </Card>
      </div>
    </PrivateLayout>
  );
}
