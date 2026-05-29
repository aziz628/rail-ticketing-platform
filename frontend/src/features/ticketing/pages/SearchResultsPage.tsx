import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { PATHS } from '@/app/paths';
import { useSearchTrips } from '@/features/ticketing/api/use-tickets';
import { useLines } from '@/features/infrastructure/api/use-infrastructure';
import { GuestLayout } from '@/components/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import type { TripSearchResponse } from '../api/tickets';

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const originId = searchParams.get('from') || '';
  const destinationId = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const lineId = searchParams.get('lineId') || '';

  const { 
    data: searchData, 
    isLoading, 
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useSearchTrips({
    originId,
    destinationId,
    date,
  });

  const { data: linesData } = useLines();

  const line = React.useMemo(() => 
    linesData?.pages.flatMap(p => p.content).find(l => l.id === lineId)
  , [linesData, lineId]);

  const originNode = line?.nodes.find(n => n.id === originId);
  const destinationNode = line?.nodes.find(n => n.id === destinationId);

  const trips = React.useMemo(() => 
    searchData?.pages.flatMap(page => page.content) || []
  , [searchData]);

  const fullDateLabel = date ? format(parseISO(date), 'EEEE d MMMM yyyy', { locale: fr }) : '';

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    
    let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMinutes < 0) diffMinutes += 24 * 60;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };

  return (
    <GuestLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-6 px-6 animate-in fade-in duration-500">
        
        {/* Error State */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold uppercase tracking-wider text-xs">Erreur de recherche</h3>
              <p className="text-sm font-medium">Une erreur est survenue lors de la récupération des trajets.</p>
            </div>
            <Button 
              variant="outline"
              className="h-10 px-6 rounded-xl font-black tracking-widest"
              onClick={() => navigate(PATHS.VOYAGER.SEARCH)}
            >
              Nouvelle recherche
            </Button>        
          </div>
        )}

        {/* Page Header - Only show when trips exist or loading */}
        {(!isError && trips.length > 0) && (
          <div className="flex flex-col gap-1">
            <h1 className="sncft-page-title flex items-center flex-wrap gap-x-3">
              <span>{originNode?.stationName || 'Départ'}</span>
              <ArrowRight className="text-primary h-6 w-6" />
              <span>{destinationNode?.stationName || 'Arrivée'}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {fullDateLabel}
            </p>
          </div>
        )}

        {/* Results List */}
        {!isLoading && !isError && trips.length > 0 && (
          <div className="grid gap-4">
            {trips.map((trip: TripSearchResponse) => (
              <div 
                key={trip.tripId}
                className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 flex-1 w-full">
                  {/* departure and arrival time */}
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{trip.departureTime}</span>
                    <ArrowRight className="text-slate-300 group-hover:text-primary transition-colors h-5 w-5" />
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{trip.arrivalTime}</span>
                  </div>
                  <div className='flex flex-row flex-wrap gap-8'>
                    {/* train Name */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Train</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{trip.trainName}</span>
                      </div>
                    </div>
                    {/* duration */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Durée</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {calculateDuration(trip.departureTime, trip.arrivalTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  {!trip.hasAvailableSeats ? (
                    <Button
                      disabled
                      variant="secondary"
                      className="px-8 h-12 rounded-xl font-bold cursor-not-allowed opacity-50"
                    >
                      Complet
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate(`${PATHS.VOYAGER.TRIP_DETAILS}?id=${trip.tripId}&from=${originId}&to=${destinationId}`)}
                      className="bg-primary text-white px-8 h-12 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Réserver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {!isLoading && !isError && hasNextPage && (
          <div className="flex items-center justify-center pt-10">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-2xl h-12 px-6 font-black uppercase tracking-[0.2em] border-2 border-slate-200 hover:border-primary hover:text-primary transition-all flex items-center gap-3 group"
            >
              {isFetchingNextPage ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ChevronDown className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
              )}
              {isFetchingNextPage ? 'Chargement...' : 'Voir plus de trajets'}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div>
              <h3 className="sncft-heading-xl-uppercase">Aucun trajet trouvé</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto mt-2">
                Désolé, nous n'avons pas trouvé de trajets correspondant à votre recherche.
              </p>
            </div>
            <Button 
              className="h-14 px-10 rounded-2xl font-black tracking-widest w-fit"
              onClick={() => navigate(PATHS.VOYAGER.SEARCH)}
            >
              Nouvelle recherche
            </Button>
          </div>
        )}
      </div>
    </GuestLayout>
  );
};
