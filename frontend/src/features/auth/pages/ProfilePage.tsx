import { useAuthStore } from "@/stores/auth";
import { PrivateLayout } from "@/components/layouts/PrivateLayout";
import { ProfileInfoRow } from "../components/ProfileInfoRow";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { useState } from "react";
import { User, Mail, UserCheck, Key, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from '@/features/auth/api/use-auth';
import { useViewMode } from '@/app/provider';

import { useNavigation } from "@/hooks/use-navigation";

export const ProfilePage = () => {
  const {paths,isStaff } = useViewMode();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const navItems = useNavigation();

  // get the current user for info display 
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content sncft-page-section">
        {/* Profile Header */}
        <div className="sncft-page-header">
          <h1 className="sncft-page-title">
            Profil
          </h1>
          <p className="sncft-page-subtitle">
            Gérez les détails de votre compte.
          </p>
        </div>

        {/* Profile Identity Card */}
        <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Détails de l'identité
              </h3>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <ProfileInfoRow 
                  label= "Nom complet" 
                  value={user.name} 
                  icon={User}
                />
                <ProfileInfoRow 
                  label= "Adresse email" 
                  value={user.email} 
                  icon={Mail}
                />
                {!isStaff && (
                  <ProfileInfoRow 
                    label="Numéro d'identité" 
                    value={user.nationalIdNumber || "Non fourni"} 
                    icon={UserCheck}
                  />
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button 
                variant="primary-sncft"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full sm:w-auto px-8 h-12 gap-2"
              >
                <Key className="h-5 w-5" />
                Changer le mot de passe
              </Button>
              <Button 
                variant="outline"
                onClick={() => logoutMutation.mutate(undefined, { onSuccess: () => navigate(paths.LOGIN) })}
                className="w-full sm:w-auto px-8 h-12 gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 border-none hover:bg-red-200"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-5 w-5" />
                {logoutMutation.isPending ? 'Déconnexion...' : 'Se déconnecter'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </PrivateLayout>
  );
};