import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Key, Eye, EyeOff } from "lucide-react";
import { changePasswordSchema, type ChangePasswordInput } from '../schemas';
import { getAuthErrorMessage, useChangePasswordMutation } from '@/features/auth/api/use-auth';
import { useNotifications } from '@/stores/notifications-store';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const changePasswordMutation = useChangePasswordMutation();
  const addNotification = useNotifications((state) => state.addNotification);
  const { register, handleSubmit, formState, reset } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'Le mot de passe a été modifié avec succès',
        });
        reset();
        onClose();
      },
      onError: (error) => {
        addNotification({
          type: 'error',
          text: getAuthErrorMessage(error, 'Échec du changement de mot de passe'),
        });
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Changer le mot de passe</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label className="sncft-label" htmlFor="old_password">Ancien mot de passe</Label>
            <div className="relative">
              <Input
                id="old_password"
                type={showOldPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full h-12 pr-12"
                {...register('oldPassword')}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formState.errors.oldPassword && <p className="text-red-600 text-sm">{String(formState.errors.oldPassword.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label className="sncft-label" htmlFor="new_password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full h-12 pr-12"
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formState.errors.newPassword && <p className="text-red-600 text-sm">{String(formState.errors.newPassword.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label className="sncft-label" htmlFor="confirm_new_password">Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full h-12 pr-12"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formState.errors.confirmPassword && <p className="text-red-600 text-sm">{String(formState.errors.confirmPassword.message)}</p>}
          </div>

          <Button 
            variant="primary-sncft"
            type="submit"
            className="w-full gap-2 mt-2"
            disabled={changePasswordMutation.isPending}
          >
            <Key className="h-5 w-5" />
            {changePasswordMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </form>
      </div>
    </div>
  );
};
