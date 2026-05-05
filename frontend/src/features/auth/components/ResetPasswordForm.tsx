import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Hash, Lock, Eye, EyeOff } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas';
import { getAuthErrorMessage, useResetPasswordMutation, useStaffResetPasswordMutation } from '@/features/auth/api/use-auth';
import { useNotifications } from '@/stores/notifications-store';
import { useViewMode } from '@/app/provider';

export const ResetPasswordForm = () => {
  const { isStaff, paths } = useViewMode();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const clientMutation = useResetPasswordMutation();
  const staffMutation = useStaffResetPasswordMutation();
  const resetPasswordMutation = isStaff ? staffMutation : clientMutation;
  const addNotification = useNotifications((state) => state.addNotification);
  const { register, handleSubmit, formState } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: () => navigate(paths.LOGIN),
      onError: (error) => {
        addNotification({
          type: 'error',
          text: getAuthErrorMessage(error, 'La réinitialisation du mot de passe a échoué'),
        });
      },
    });
  };

  return (
    <Card className="sncft-card w-full max-w-md">
      <div className="p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-slate-900 text-2xl font-extrabold tracking-tight mb-2">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-slate-500 text-sm">
            Entrez le code à 8 chiffres envoyé à votre adresse e-mail et choisissez un nouveau mot de passe.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="sncft-label pl-1" htmlFor="code">
              Code de vérification
            </Label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input id="code" maxLength={8} placeholder="Entrez le code à 8 chiffres" className="pl-12 tracking-widest font-medium" {...register('otp')} />
            </div>
            {formState.errors.otp && <p className="text-red-600 text-sm">{String(formState.errors.otp.message)}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="sncft-label pl-1" htmlFor="password">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Entrez le nouveau mot de passe" className="pl-12" {...register('newPassword')} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formState.errors.newPassword && <p className="text-red-600 text-sm">{String(formState.errors.newPassword.message)}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="sncft-label pl-1" htmlFor="confirm_password">
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input id="confirm_password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmez votre mot de passe" className="pl-12" {...register('confirmPassword')} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formState.errors.confirmPassword && <p className="text-red-600 text-sm">{String(formState.errors.confirmPassword.message)}</p>}
          </div>

          <Button variant="primary-sncft" className="w-full mt-2" type="submit" disabled={resetPasswordMutation.isPending}>
            {resetPasswordMutation.isPending ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            Vous n'avez pas reçu le code ?{" "}
            <Link to={paths.FORGOT} className="sncft-link">
              Renvoyer un autre code
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
};
