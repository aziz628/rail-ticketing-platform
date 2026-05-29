import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Train, 
  AlertCircle, 
  ShieldAlert, 
  CreditCard,
  Loader2,
  Lock,
  Ban,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SEAT_CLASS_LABELS } from '../constants/translations';

import { PATHS } from '@/app/paths';
import { useBookingDetails, useInitiatePayment, useBookFree } from '@/features/ticketing/api/use-tickets';
import { useAuthStore } from '@/stores/auth';
import { GuestLayout } from '@/components/layouts/GuestLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/stores/notifications-store';
import type { SeatClassPriceResponse } from '../api/tickets';

export const TicketDetailsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotifications((state) => state.addNotification);

  const tripId = searchParams.get('id') || '';
  const originId = searchParams.get('from') || '';
  const destinationId = searchParams.get('to') || '';

  const { data: booking, isLoading, isError, error } = useBookingDetails(tripId, {
    originId,
    destinationId,
  });

  const initiatePayment = useInitiatePayment();
  const bookFree = useBookFree();
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);

  // Auto-select first available class
  React.useEffect(() => {
    if (booking?.seatClasses && !selectedClassId) {
      const firstAvailable = booking.seatClasses.find((sc: SeatClassPriceResponse) => sc.available);
      if (firstAvailable) {
        setSelectedClassId(firstAvailable.id);
      }
    }
  }, [booking, selectedClassId]);

  // select the class 
  const selectedClass = React.useMemo(() => 
    booking?.seatClasses.find((sc: SeatClassPriceResponse) => sc.id === selectedClassId)
  , [booking, selectedClassId]);

  const handlePurchase = (useFreeBooking: boolean = false) => {
    // Redirection vers le login
    if (!isAuthenticated) {
      navigate(PATHS.VOYAGER.LOGIN);
      return;
    }
    // selection de la classe
    if (!selectedClassId) return;

    const payload = {
      tripId,
      originLineNodeId: originId,
      destinationLineNodeId: destinationId,
      seatClassId: selectedClassId,
    };

    if (useFreeBooking) {
      // Réservation gratuite avec abonnement
      bookFree.mutate(payload, {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: 'Billet réservé gratuitement avec votre abonnement !',
          });
          navigate(PATHS.VOYAGER.TICKETS);
        },
        onError: (err: any) => {
          addNotification({
            type: 'error',
            text: err.response?.data?.message || "Échec de la réservation gratuite",
          });
        }
      });
    } else {
      // Paiement classique
      initiatePayment.mutate(payload, {
        onSuccess: (data: any) => {
          // Redirection vers le paiement
          navigate(`${PATHS.VOYAGER.PAYMENT}/${data.pspSessionId}?targetType=TICKET`);
        },
        onError: (err: any) => {
          addNotification({
            type: 'error',
            text: err.response?.data?.message || "Échec de l'initialisation du paiement",
          });
        }
      });
    }
  };



  if (isLoading) {
    return (
      <GuestLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Chargement de votre voyage...
          </p>
        </div>
      </GuestLayout>
    );
  }

  if (isError || !booking) {
    return (
      <GuestLayout>
        <div className="max-w-xl mx-auto py-20 text-center space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-full inline-block">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="sncft-heading-xl-uppercase tracking-tight">Voyage inaccessible</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {(error as any)?.response?.data?.message || "Désolé, nous ne parvenons pas à récupérer les détails de ce voyage."}
            </p>
          </div>
          <Button onClick={() => navigate(PATHS.VOYAGER.SEARCH)} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest w-fit mx-auto">
            Retour à la recherche
          </Button>
        </div>
      </GuestLayout>
    );
  }

  const departureTime = booking.departureTime;
  const arrivalTime = booking.arrivalTime;
  const fullDate = format(parseISO(booking.date), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <GuestLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Détails du voyage</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Vérifiez votre trajet et finalisez votre réservation.</p>
        </div>

        <div className="grid grid-cols-1 ">
          <div className="lg:col-span-2 space-y-6">
            {/* Journey Card */}
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8 rounded-3xl">
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-center md:text-left">
                  <p className="sncft-heading-lg uppercase tracking-tighter">{booking.originName}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Départ</p>
                </div>
                <div className="flex-1 flex flex-col items-center px-4">
                   <div className="w-full flex items-center gap-2">
                     <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                     <Train className="h-6 w-6 text-primary shrink-0" />
                     <div className="h-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 mt-2">{booking.trainName}</span>
                </div>
                <div className="space-y-1 text-center md:text-right">
                  <p className="sncft-heading-lg uppercase tracking-tighter">{booking.destinationName}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Arrivée</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Date</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{fullDate}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Horaire</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-100">{departureTime} → {arrivalTime}</p>
                </div>
 
              </div>
            </Card>

            {/* Seat Class Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white  tracking-widest">Classe de voyage</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {booking.seatClasses.map((sc: SeatClassPriceResponse) => (
                  <button
                    key={sc.id}
                    disabled={!sc.available}
                    onClick={() => setSelectedClassId(sc.id)}
                    className={cn(
                      "relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left",
                      !sc.available && "opacity-40 grayscale cursor-not-allowed",
                      selectedClassId === sc.id 
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] mb-4",
                      selectedClassId === sc.id ? "text-primary" : "text-slate-400"
                    )}>
                      {SEAT_CLASS_LABELS[sc.type] || sc.type}
                    </span>
                    <div className="mt-auto">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {sc.finalPrice.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-1">DT</span>
                    </div>
                    {!sc.available && (
                      <div className="absolute top-4 right-4 text-[10px] font-black text-red-500 uppercase tracking-tighter">Complet</div>
                    )}
                    {selectedClassId === sc.id && (
                      <div className="absolute top-4 right-4">
                        <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                           <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 mt-8">
            {/* Summary & Checkout Card */}
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 sticky top-24 rounded-3xl">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Récapitulatif</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold">Prix de base</span>
                  <span className="text-slate-900 dark:text-white font-black">{selectedClass?.basePrice.toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold">Classe </span>
                  <span className="text-slate-900 dark:text-white font-black">
                    {(() => {
                      if (!selectedClass) return '';
                      const diff = selectedClass.finalPrice - selectedClass.basePrice;
                      const diffRounded = Number(diff.toFixed(2));
                      // if the diff is 0, return + 0.00 DT
                      if (diffRounded === 0) return '+ 0.00 DT';
                      // returned the diff with the sign 
                      return diffRounded > 0 ? `+ ${diffRounded.toFixed(2)} DT` : `- ${Math.abs(diffRounded).toFixed(2)} DT`;
                    })()}
                  </span>
                </div>
                
                <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-black uppercase text-slate-900 dark:text-white">Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-primary dark:text-blue-400">{selectedClass?.finalPrice.toFixed(2)}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase">DT</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate(PATHS.VOYAGER.LOGIN)}
                      variant='default'
                      className="w-full h-14"
                    >
                      Connecter
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                      Connectez-vous pour bénéficier de vos avantages
                    </p>
                  </div>
                ) : booking.userBlocked ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400 flex gap-3">
                    <Ban className="h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">Compte temporairement bloqué. Réessayez après minuit.</p>
                  </div>
                ) : booking.isAlreadyBought ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-amber-700 dark:text-amber-400 flex gap-3">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">Vous avez déjà un billet pour ce trajet.</p>
                  </div>
                ) /*if all above are false, check if free booking is allowed, if yes show the free booking button, otherwise show the pay button*/
                : booking?.freeBookingAllowed ? 
                      <Button 
                        onClick={() => handlePurchase(true)}
                        disabled={bookFree.isPending}
                        variant='outline'
                        className="w-full h-14 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        {bookFree.isPending ? (
                           <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                           <span>Réserver gratuitement</span>
                        )}
                      </Button>
                    :
                    <Button 
                      onClick={() => handlePurchase(false)}
                      disabled={initiatePayment.isPending || bookFree.isPending}
                      variant='default'
                      className="w-full h-14"
                    >
                      {initiatePayment.isPending ? (
                         <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                         <CreditCard className="h-6 w-6 mr-2" />
                      )}
                      Payer
                    </Button>
              }
              </div>
            </Card>

            {/* Safety Warning */}
            <div className="w-fit p-4 bg-slate-200 dark:bg-slate-800/50 rounded-2xl flex gap-3 border border-slate-100 dark:border-slate-800">
               <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
               <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                 Réservation disponible jusqu'à 15 minutes avant le départ. 
               </p>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};
