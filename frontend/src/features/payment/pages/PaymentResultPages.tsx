import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Ticket, 
  Search, 
  AlertTriangle
} from 'lucide-react';

import { PATHS } from '@/app/paths';
import { Button } from '@/components/ui/button';
import { GuestLayout } from '@/components/layouts/GuestLayout';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetType = (searchParams.get('targetType') || 'TICKET').toUpperCase();
  const isSubscription = targetType === 'SUBSCRIPTION';

  return (
    <GuestLayout>
      <div className="max-w-2xl mx-auto  px-4 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="relative inline-block">
          <div className="h-20 w-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12   text-green-500" />
          </div>
        </div>  

        <div className="space-y-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Paiement Réussi !</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
            {!isSubscription 
            ? "Votre billet a été généré avec succès. Vous pouvez le retrouver dans votre espace personnel."
            :"Votre abonnement a été ajouté avec succès. Vous pouvez le retrouver dans votre espace personnel "
            }
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate(isSubscription ? PATHS.VOYAGER.SUBSCRIPTIONS : PATHS.VOYAGER.TICKETS)}
            className="h-12  rounded-2xl bg-primary text-white font-black  tracking-widest gap-3 shadow-2xl shadow-primary/30"
          >
            <Ticket className="h-6 w-6" />
            {isSubscription ? 'Mes Abonnements' : 'Mes Billets'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate( isSubscription ? PATHS.VOYAGER.OFFERS : PATHS.VOYAGER.SEARCH)}
            className="h-12 rounded-2xl border-2 font-black  tracking-widest gap-3"
          >
            <Search className="h-6 w-6" />
            {isSubscription ? 'Nouvel Abonnement' : 'Nouveau Trajet'}
          </Button>
        </div>

      </div>
    </GuestLayout>
  );
};

export const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const targetType = (searchParams.get('targetType') || 'TICKET').toUpperCase();
  const isSubscription = targetType === 'SUBSCRIPTION';

  const navigate = useNavigate();

  return (
    <GuestLayout>
      <div className="max-w-2xl mx-auto px-4 text-center space-y-8  animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="h-20 w-20 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center ">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Échec du Paiement</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
            Nous n'avons pas pu traiter votre transaction.
          </p>
        </div>

        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 flex gap-4 text-left">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Attention</p>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-500 leading-relaxed">
              Trop de tentatives de paiement échouées peuvent entraîner un blocage temporaire de votre compte jusqu'à minuit.
            </p>
          </div>
        </div>


        {!isSubscription && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate(PATHS.VOYAGER.TICKETS)}
            className="h-12  rounded-2xl bg-primary text-white font-black  tracking-widest gap-3 shadow-2xl shadow-primary/30"
          >
            Mes Billets
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate(PATHS.VOYAGER.SEARCH)}
            className="h-12 rounded-2xl border-2 font-black  tracking-widest gap-3"
          >
            Réessayer une recherche
          </Button>
        </div>
        }
      </div>
    </GuestLayout>
  );
};
