import * as React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Timer, 
  CreditCard, 
  Calendar as CalendarIcon, 
  KeyRound, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';

import { usePspSession, useProcessPayment } from '../api/use-psp';
import type { PaymentTargetType } from '../api/psp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pspPaymentSchema, type PspPaymentFormValues } from '../api/schemas';
import PATHS from '@/app/paths';

export const PaymentPspPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: session, isLoading, isError } = usePspSession(sessionId || '');
  const processPayment = useProcessPayment();
  const targetType = (searchParams.get('targetType') || 'TICKET') as PaymentTargetType;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PspPaymentFormValues>({
    resolver: zodResolver(pspPaymentSchema),
    defaultValues: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  // initialize the timer with the remaining time from the session
  const [timeLeft, setTimeLeft] = React.useState<number | undefined>(); 

  // sync timeLeft with session data
  React.useEffect(() => {
    if (session?.remainingTimeinSecondes !== undefined && timeLeft === undefined) {
      setTimeLeft(session.remainingTimeinSecondes);
    }
  }, [session, timeLeft]);

  // simulate timer countdown and handle expiry
  React.useEffect(() => {
    if (timeLeft === undefined) return;

    if (timeLeft === 0) {
      navigate(PATHS.VOYAGER.PAYMENT_FAILED);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === undefined) return undefined;
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft === undefined, timeLeft === 0, navigate]);

  const formatTime = (seconds: number | undefined) => {
    if (seconds === undefined) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const onSubmit = (values: PspPaymentFormValues) => {
    if (!sessionId) return;

    processPayment.mutate({
      targetType,
      data: {
        pspSessionId: sessionId,
        cardNumber: values.cardNumber.replace(/\s/g, ''), // remove spaces from card number
        expiryDate: values.expiryDate,
        cvv: values.cvv,
      },
    }, {
      onSuccess: () => {
        navigate(PATHS.VOYAGER.PAYMENT_SUCCESS + `?targetType=${targetType}`);
      },
      onError: (err: any) => {
        // If the session is gone (410), redirect to failed page.
        if (err.response?.status === 410) {
          navigate(PATHS.VOYAGER.PAYMENT_FAILED);
        }
        else if (err.response?.status === 404) {
         navigate(PATHS.VOYAGER.PAYMENT_FAILED);
        }
      }
    });
  };

  if (isLoading) {
    return (
       <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
         <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-10 w-10 text-primary animate-spin" />
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Connexion sécurisée...</p>
         </div>
       </div>
    );
  }

  // If there's a hard error loading the session show failure page
  if (isError && !session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 text-center shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full inline-block">
             <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="sncft-heading-lg uppercase tracking-tight">Session invalide</h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Cette session de paiement n'existe plus ou est invalide.</p>
          </div>
          <Button onClick={() => navigate(PATHS.VOYAGER.SEARCH)} className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* PSP Header */}
        <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Paiement Sécurisé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-mono text-sm font-black rounded-xl border border-amber-100 dark:border-amber-900/30">
              <Timer className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Amount Summary */}
          <div className="text-center space-y-2">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Montant à régler</p>
            <div className="flex items-baseline justify-center gap-1">
               <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                 {session?.amount?.toFixed(2) ?? '--'}
               </h1>
               <span className="text-lg font-black text-slate-300">DT</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numéro de carte</label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input
                    {...register('cardNumber')}
                    placeholder="0000 0000 0000 0000"
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      value = value.match(/.{1,4}/g)?.join(' ') || value;
                      setValue('cardNumber', value, { shouldValidate: true });
                    }}
                    maxLength={19}
                    className={cn(
                      "h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 font-mono tracking-widest text-base focus-visible:ring-primary",
                      errors.cardNumber && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                {errors.cardNumber && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.cardNumber.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiration</label>
                  <div className="relative group">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input
                      {...register('expiryDate')}
                      placeholder="MM/YY"
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2, 4);
                        }
                        setValue('expiryDate', value, { shouldValidate: true });
                      }}
                      maxLength={5}
                      className={cn(
                        "h-14 pl-11 rounded-2xl border-slate-100 dark:border-slate-800 text-center font-mono text-base focus-visible:ring-primary",
                        errors.expiryDate && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </div>
                  {errors.expiryDate && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.expiryDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input
                      {...register('cvv')}
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      className={cn(
                        "h-14 pl-11 rounded-2xl border-slate-100 dark:border-slate-800 text-center font-mono text-base focus-visible:ring-primary",
                        errors.cvv && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </div>
                  {errors.cvv && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.cvv.message}</p>}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={processPayment.isPending}
              className="w-full h-16 bg-primary text-white rounded-2xl font-black text-md 
              hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30
              tracking-widest flex items-center justify-center gap-3"
            >
              {processPayment.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
              Valider le paiement
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};
