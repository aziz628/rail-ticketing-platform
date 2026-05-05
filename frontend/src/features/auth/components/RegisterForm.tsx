import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '@/app/paths';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema, type RegisterInput } from '../schemas';
import { getAuthErrorMessage, useRegisterMutation } from '@/features/auth/api/use-auth';
import type { AuthRegisterRequest } from '../types/auth';
import { useNotifications } from '@/stores/notifications-store';

export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const addNotification = useNotifications((state) => state.addNotification);

  const { register, handleSubmit, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nationalIdType: 'CIN',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    const request: AuthRegisterRequest = {
      email: data.email,
      password: data.password,
      nationalIdNumber: data.nationalIdNumber,
      nationalIdType: data.nationalIdType as AuthRegisterRequest['nationalIdType'],
    };

    registerMutation.mutate(request, {
      onSuccess: () => navigate(PATHS.VOYAGER.PROFILE),
      onError: (error) => {
        addNotification({
          type: 'error',
          text: getAuthErrorMessage(error, 'L\'inscription a échoué'),
        });
      },
    });
  };

  return (
    <Card className="sncft-card w-full max-w-md">
      <div className="p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-slate-900 text-2xl font-extrabold tracking-tight mb-1">
            Créer un compte
          </h1>
          <p className="text-slate-500 text-sm">
            Rejoignez le réseau ferroviaire national et gérez vos voyages.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label className="sncft-label pl-1" htmlFor="email">
              Adresse e-mail
            </Label>
            <Input id="email" type="email" {...register('email')} placeholder="nom@domaine.tn" />
            {formState.errors.email && <p className="text-red-600 text-sm">{String(formState.errors.email.message)}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="sncft-label pl-1" htmlFor="password">
                Mot de passe
              </Label>
              <div className="relative">
                <Input id="password" {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formState.errors.password && <p className="text-red-600 text-sm">{String(formState.errors.password.message)}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="sncft-label pl-1" htmlFor="confirm_password">
                Confirmation
              </Label>
              <div className="relative">
                <Input id="confirm_password" {...register('confirmPassword')} type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formState.errors.confirmPassword && <p className="text-red-600 text-sm">{String(formState.errors.confirmPassword.message)}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="sncft-label pl-1">
              Type d'identification
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2.5 bg-background rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors group">
                <input
                  type="radio" id='cin'
                  value="CIN"
                  {...register('nationalIdType')}
                  className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">CIN</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-background rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors group">
                <input
                  type="radio" id='birthCert'
                  value="BIRTH_CERT"
                  {...register('nationalIdType')}
                  className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">Extrait de naissance</span>
              </label>
            </div>
            {formState.errors.nationalIdType && <p className="text-red-600 text-sm">{String(formState.errors.nationalIdType.message)}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="sncft-label pl-1" htmlFor="id_number">
              Numéro d'ID
            </Label>
            <Input id="id_number" {...register('nationalIdNumber')} placeholder="Entrez votre numéro d'identité" />
            {formState.errors.nationalIdNumber && <p className="text-red-600 text-sm">{String(formState.errors.nationalIdNumber.message)}</p>}
          </div>

          <Button variant="primary-sncft" className="w-full mt-2" type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Création du compte...' : 'Créer un compte'}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Vous avez déjà un compte ?{" "}
            <Link to={PATHS.VOYAGER.LOGIN} className="sncft-link">
              Se connecter ici
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
};
