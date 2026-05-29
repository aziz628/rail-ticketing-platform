import * as React from 'react';
import { Download, ArrowRight, Ticket as TicketIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { useTickets, useDownloadTicket } from '../api/use-tickets';
import { TICKET_FILTERS, type TicketFilter } from '../api/tickets';
import { SEAT_CLASS_LABELS, TICKET_STATUS_LABELS } from '../constants/translations';
import { useNotifications } from '@/stores/notifications-store';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const MyTicketsPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const addNotification = useNotifications((state) => state.addNotification);

  const [activeTab, setActiveTab] = React.useState<TicketFilter>(TICKET_FILTERS.UPCOMING);

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTickets(activeTab);

  const downloadTicket = useDownloadTicket();

  const tickets = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.content) || [];
  }, [data]);

  const handleDownload = (ticketId: string) => {
    downloadTicket.mutate(ticketId, {
      onSuccess: (blob) => {
        // Create a blob URL and trigger browser download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `billet-sncft-${ticketId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      },
      onError: (err: any) => {
        if (!err._globallyHandled) {
          addNotification({
            type: 'error',
            text: err.response?.data?.message || 'Erreur lors du téléchargement du billet.',
          });
        }
      }
    });
  };

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content sncft-page-section">
        
        {/* Page Header */}
        <div className="flex flex-wrap justify-between gap-3">
          <div className="sncft-page-header">
            <h1 className="sncft-page-title">
              Mes Billets
            </h1>
            <p className="sncft-page-subtitle">
              Gérez vos prochains voyages et consultez votre historique.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sncft-tabs">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab(TICKET_FILTERS.UPCOMING)}
              className={cn(
                "sncft-tab",
                activeTab === TICKET_FILTERS.UPCOMING
                  ? "sncft-tab-active"
                  : "sncft-tab-inactive"
              )}
            >
              À venir
            </button>
            <button
              onClick={() => setActiveTab(TICKET_FILTERS.PAST)}
              className={cn(
                "sncft-tab",
                activeTab === TICKET_FILTERS.PAST
                  ? "sncft-tab-active"
                  : "sncft-tab-inactive"
              )}
            >
              Passés
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <RotatingLoader label="Chargement de vos billets..." />
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <TicketIcon className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="sncft-heading-md">Aucun billet trouvé</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {activeTab === TICKET_FILTERS.UPCOMING 
                    ? "Vous n'avez aucun voyage de prévu pour le moment." 
                    : "Votre historique de voyages est vide."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={cn(
                    "p-5 transition-all",
                    activeTab === TICKET_FILTERS.UPCOMING
                      ? "bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 hover:shadow-md"
                      : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {ticket.originStationName}
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        {ticket.destinationStationName}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        <span className="font-semibold">Date:</span> {ticket.date} •{' '}
                        <span className="font-semibold">Heure:</span> {ticket.departureTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "block text-xl font-black",
                        activeTab === TICKET_FILTERS.UPCOMING ? "text-primary dark:text-blue-400" : "text-slate-400 italic "
                      )}>
                        {ticket.price.toFixed(2)} DT
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {SEAT_CLASS_LABELS[ticket.seatClassName] || ticket.seatClassName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest",
                      activeTab === TICKET_FILTERS.UPCOMING
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                      {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                    {activeTab === TICKET_FILTERS.UPCOMING && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDownload(ticket.id)}
                          disabled={downloadTicket.isPending}
                        >
                          {downloadTicket.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {downloadTicket.isPending ? 'Téléchargement...' : 'Télécharger PDF'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <LoadMoreButton
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={() => fetchNextPage()}
                    label="Afficher plus de billets"
                    className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PrivateLayout>
  );
};
