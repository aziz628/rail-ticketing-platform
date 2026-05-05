import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PATHS } from '@/app/paths';
import { buttonVariants } from "@/components/ui/button";
import { Header } from "@/components/navigation/Header";
import { useViewMode } from "@/app/provider";

export const PublicLayout = ({ children }: { children: ReactNode }) => {

  const location = useLocation();

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
          <nav className="flex items-center gap-4 md:gap-8">
            <Link to="/search" className="sncft-nav-link">
              Rechercher trajet
            </Link>
            <Link to="/offers" className="sncft-nav-link">
              Nos offres
            </Link>
          </nav>
        }
        // guest pages login & register 
        rightContent={
          !isAuthPage && (
          <div className="flex items-center gap-2 md:gap-3">
                <Link to={PATHS.VOYAGER.LOGIN} className={buttonVariants({ variant: "ghost" })}>Se connecter</Link>
                <Link to={PATHS.VOYAGER.REGISTER} className={buttonVariants({ variant: "primary-sncft" })}>S'inscrire</Link> 
            </div>
          )
        }
      />

      <main className="flex-grow mt-16 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-7xl flex items-center justify-center">
          {children}
        </div>
      </main>
    </div>
  );
};