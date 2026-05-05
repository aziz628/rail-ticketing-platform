import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '@/app/paths';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginInput } from '../schemas';
import { getAuthErrorMessage, useLoginMutation, useStaffLoginMutation } from '@/features/auth/api/use-auth';
import { useNotifications } from '@/stores/notifications-store';
import { useViewMode } from '@/app/provider';

export const LoginForm = () => {
  const { isStaff, paths } = useViewMode();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // get the right login mutation based on the role
  const loginMutation = isStaff ? useStaffLoginMutation() : useLoginMutation();

  const addNotification = useNotifications((state) => state.addNotification);

  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    loginMutation.mutate(data, {
      onSuccess: () => navigate(paths.PROFILE),
      onError: (error) => {
        addNotification({
          type: 'error',
          text: getAuthErrorMessage(error, 'La connexion a échoué'),
        });
      },
    });
  };

  return (
    <Card className="sncft-card w-full max-w-md">
      <div className="p-6 md:p-8">

        <div className="mb-8 text-center">
          <h1 className="text-slate-900 text-2xl font-extrabold tracking-tight mb-2">
            {isStaff ? 'Portail Staff' : 'Bienvenue'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isStaff ? 'Connectez-vous pour accéder aux comptes administratifs.' : 'Connectez-vous pour gérer vos billets et abonnements.'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label className="sncft-label pl-1" htmlFor="email">
              Adresse e-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input id="email" {...register('email')} placeholder="nom@domaine.tn" className="pl-12" />
            </div>
            {formState.errors.email && <p className="text-red-600 text-sm mt-1">{String(formState.errors.email.message)}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center pl-1">
               <Label className="sncft-label" htmlFor="password">Mot de passe</Label>
               <Link to={paths.FORGOT} className="sncft-link text-xs">Mot de passe oublié ?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input id="password" {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formState.errors.password && <p className="text-red-600 text-sm mt-1">{String(formState.errors.password.message)}</p>}
          </div>

          <Button variant="primary-sncft" className="w-full mt-2" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        {!isStaff && (
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">Nouveau chez SNCFT ?{' '}
              <Link to={PATHS.VOYAGER.REGISTER} className="sncft-link">Inscrivez-vous</Link>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
