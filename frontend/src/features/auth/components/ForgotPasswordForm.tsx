import { Link, useNavigate } from "react-router-dom";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';
import { getAuthErrorMessage, useForgotPasswordMutation, useStaffForgotPasswordMutation } from '@/features/auth/api/use-auth';
import { useNotifications } from '@/stores/notifications-store';
import { useViewMode } from '@/app/provider';

export const ForgotPasswordForm = () => {
  const { isStaff, paths } = useViewMode();
  const clientMutation = useForgotPasswordMutation();
  const staffMutation = useStaffForgotPasswordMutation();
  const forgotPasswordMutation = isStaff ? staffMutation : clientMutation;
  const navigate = useNavigate();
  const addNotification = useNotifications((state) => state.addNotification);
  const { register, handleSubmit, formState } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(data.email, {
      onSuccess: () => navigate(paths.RESET),
      onError: (error) => {
        addNotification({
          type: 'error',
          text: getAuthErrorMessage(error, 'Impossible d\'envoyer le code de réinitialisation'),
        });
      },
    });
  };

  return (
    <Card className="sncft-card w-full max-w-md">
      <div className="p-6 md:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-slate-900 text-2xl font-extrabold tracking-tight mb-2">
            Récupération du compte
          </h1>
          <p className="text-slate-500 text-sm">
            Entrez votre adresse e-mail et nous vous enverrons un code sécurisé pour récupérer votre compte.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="sncft-label pl-1" htmlFor="email">
              Adresse e-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input id="email" type="email" placeholder="nom@domaine.tn" className="pl-12" {...register('email')} />
            </div>
            {formState.errors.email && <p className="text-red-600 text-sm">{String(formState.errors.email.message)}</p>}
          </div>

          <Button variant="primary-sncft" className="w-full mt-4" type="submit" disabled={forgotPasswordMutation.isPending}>
            {forgotPasswordMutation.isPending ? 'Envoi en cours...' : 'Envoyer le code'}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            Vous vous en souvenez ?{" "}
            <Link to={paths.LOGIN} className="sncft-link">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
};
