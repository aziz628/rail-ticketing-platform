import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Schedule } from '../types';
import { cn } from '@/lib/utils';
import { UserCog, CalendarX, Trash2, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SchedulesTableProps {
  schedules: Schedule[];
  onReassign: (schedule: Schedule) => void;
  onDeactivate: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  isLoading?: boolean;
  activeTab: string;
}

// Day labels matching the bitmask positions (Mon=0 ... Sun=6)
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function SchedulesTable({ schedules, onReassign, onDeactivate, onDelete, isLoading, activeTab }: SchedulesTableProps) {
  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Chargement des horaires...</div>;
  }

  if (schedules.length === 0) {
    return <div className="p-12 text-center text-slate-400 italic">Aucun horaire trouvé.</div>;
  }
  // make the rows of deactivated schedules have slight grey background and the text to be greyed out
 const isActivated = activeTab === 'ACTIVE';
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ligne</TableHead>
            <TableHead>Train</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Jours Actifs</TableHead>
            <TableHead>Itinéraire & Horaires</TableHead>
            <TableHead>Contrôleur</TableHead>
            {activeTab === 'ACTIVE' && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow
              key={schedule.id}
              className={cn(
                "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                !isActivated && "bg-slate-100 dark:bg-slate-800"
              )}
            >
              {/* Line Name */}
              <TableCell className="align-top pt-5">
                <p className={cn("font-bold", !isActivated && "text-slate-400 dark:text-slate-500")}>
                  {schedule.lineName}
                </p>
              </TableCell>

              {/* Train Type */}
              <TableCell className="align-top pt-5">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{schedule.trainName}</p>
              </TableCell>

              {/* Dates — activation stacked above deactivation */}
              <TableCell className="align-top pt-5">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Du {schedule.activationDate}</p>
                  {schedule.deactivationDate ? (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Au {schedule.deactivationDate}</p>
                  ) : (
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter ">Permanent</p>
                  )}
                </div>
              </TableCell>

              {/* Bitmask Day Bubbles */}
              <TableCell className="align-top pt-5">
                <div className="flex gap-1">
                  {DAYS.map((day, idx) => {
                    const isActive = schedule.daysBitmask[idx] === '1';
                    return (
                      <span
                        key={idx}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded",
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-400"
                        )}
                      >
                        {day}
                      </span>
                    );
                  })}
                </div>
              </TableCell>

              {/* Timeline */}
              <TableCell className="align-top pt-4">
                <details className="text-slate-700 dark:text-slate-300 outline-none group">
                  {/* Route summary: start → end with expand icon */}
                  <summary className="list-none outline-none cursor-pointer flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 -ml-1 rounded-lg w-max transition-colors">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {schedule.stops[0]?.stationName} 
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {schedule.stops[schedule.stops.length - 1]?.stationName} 
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                  </summary>

                  {/* Expanded stop timeline */}
                  <div className="mt-2 space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 w-max shadow-sm">
                    {schedule.stops.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        <span className="font-bold  text-slate-600 dark:text-slate-300 text-xs">{stop.stationName}</span>
                        {/*only show hour and min*/}
                        <span className="text-slate-400 font-mono font-medium">{stop.arrivalTime.split(':').slice(0, 2).join(':')}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </TableCell>

              {/* Assigned Controller */}
              <TableCell className="align-top pt-5">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{schedule.controllerName}</p>
              </TableCell>
              
              {/* Action Buttons - Reassign, Deactivate, Delete , hide when schedule deactivation date is before today */}
              {activeTab === 'ACTIVE' && <TableCell className="text-right align-top pt-4">
                <div className="flex items-center justify-end gap-1">
                  {/* Reassign controller */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onReassign(schedule)}
                    className="p-2 h-auto w-auto text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Réassigner le contrôleur"
                  >
                    <UserCog className="h-5 w-5" />
                  </Button>

                  {/* Deactivate , disabled when canDeactivate is false */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeactivate(schedule)}
                    disabled={!schedule.canDeactivate}
                    className={cn(
                      "p-2 h-auto w-auto rounded-lg transition-colors",
                      schedule.canDeactivate
                        ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "text-slate-300 opacity-40 cursor-not-allowed"
                    )}
                    title="Désactiver"
                  >
                    <CalendarX className="h-5 w-5" />
                  </Button>

                  {/* Hard delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(schedule)}
                    disabled={!schedule.canDelete}
                    className={cn(
                      "p-2 h-auto w-auto rounded-lg transition-colors",
                      schedule.canDelete
                        ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-slate-300 opacity-40 cursor-not-allowed"
                    )}
                    title="Supprimer"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </TableCell>
              }
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
