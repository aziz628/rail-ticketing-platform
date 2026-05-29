import { AlertCircle, ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Trip } from '../types';

interface TripsTableProps {
  trips: Trip[];
  isLoading: boolean;
}

export function TripsTable({ trips, isLoading }: TripsTableProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Chargement des voyages...
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="text-slate-500 font-bold">Aucun voyage trouvé pour cette sélection.</p>
      </div>
    );
  }


  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-8">Itinéraire</TableHead>
            <TableHead>Train</TableHead>
            <TableHead>Date & Heure</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              {/* Itinerary */}
              <TableCell className="align-top pt-5 pl-8">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {trip.startStopName}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {trip.endStopName}
                  </span>
                </div>
              </TableCell>
              
              {/*train*/}
              <TableCell className="align-top pt-5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {trip.trainName}
                </p>
              </TableCell>

              {/* Date */}
              <TableCell className="align-top pt-5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {trip.date} 
                </p>
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
