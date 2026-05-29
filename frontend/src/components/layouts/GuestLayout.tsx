import { type ReactNode } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PrivateLayout } from "@/components/layouts/PrivateLayout";
import { useAuthStore } from "@/stores/auth";
import { useNavigation } from "@/hooks/use-navigation";
import { ROLES } from "@/features/auth/types/auth";

interface GuestLayoutProps {
  children: ReactNode;
}

/**
 * A layout that automatically switches between PublicLayout and PrivateLayout
 * based on the user's authentication state. Used for pages that are accessible 
 * to both guests and logged-in users (e.g., Search, Offers).
 */
export const GuestLayout = ({ children }: GuestLayoutProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const navItems = useNavigation();

  if (isAuthenticated && user?.role==ROLES.VOYAGER) {
    return (
      <PrivateLayout 
        navItems={navItems || []} 
        user={{ name: user.name, role: user.role }}
      >
        {children}
      </PrivateLayout>
    );
  }

  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
};
