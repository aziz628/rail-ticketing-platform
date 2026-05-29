import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PATHS } from '@/app/paths';
import { buttonVariants } from "@/components/ui/button";
import { Header } from "@/components/navigation/Header";
import { useViewMode } from "@/app/provider";

import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { ROLES } from "@/features/auth/types/auth";

export const PublicLayout = ({ children }: { children: ReactNode }) => {

  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // get pages paths of current user role 
  const { paths } = useViewMode();
  
  const isAuthPage = [
    paths.LOGIN, 
    paths.FORGOT, 
    paths.RESET,    
    PATHS.VOYAGER.REGISTER
  ].includes(location.pathname as any);

  return (
    <div className="min-h-screen flex flex-col bg-background-page font-sans transition-colors duration-300">
      <Header 
        centerContent={
          // show search and offers for guest or non voyager users 
          (!isAuthenticated || user?.role !== 'VOYAGER' ) && (
            <nav className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <Link to={PATHS.VOYAGER.SEARCH} className="sncft-nav-link py-2 md:py-0">
                Rechercher trajet
              </Link>
              <Link to={PATHS.VOYAGER.OFFERS} className="sncft-nav-link py-2 md:py-0">
                Nos offres
              </Link>
            </nav>
          )
        }
        // guest pages login & register 
        rightContent={
          !isAuthPage && (
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
              {isAuthenticated && user?.role== ROLES.VOYAGER 
              // show user name if voyager logged in
              ? (
                <Link 
                  to={PATHS.VOYAGER.PROFILE} 
                  className={buttonVariants({ variant: "ghost" })}
                >
                  {user?.name || "Mon Compte"}
                </Link>
              ) 
              : (
                <>
                  <Link to={PATHS.VOYAGER.LOGIN} className={buttonVariants({ variant: "outline", className: "w-full md:w-auto" })}>Se connecter</Link>
                  <Link to={PATHS.VOYAGER.REGISTER} className={buttonVariants({ variant: "primary-sncft", className: "w-full md:w-auto" })}>S'inscrire</Link> 
                </>
              )}
            </div>
          )
        }
      />

      <main className={cn(
        "flex-grow mt-16 p-6",
        isAuthPage && "flex items-center justify-center"
      )}>
        <div className={cn(
          "w-full max-w-7xl",
          isAuthPage && "flex items-center justify-center"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
};