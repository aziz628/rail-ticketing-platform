import { useMemo } from 'react';
import { Search, Tag, Ticket, CreditCard, User, MapPin, Train, Route, Users, Calendar, Activity, Inbox, LayoutDashboard } from 'lucide-react';
import { PATHS } from '@/app/paths';
import { useViewMode } from '@/app/provider';
import { useAuthStore } from '@/stores/auth';
import { ROLES } from '@/features/auth/types/auth';

export const useNavigation = () => {
  const { isStaff } = useViewMode();
  const user = useAuthStore((state) => state.user);

  const voyagerNavItems = useMemo(() => [
    { label: "Rechercher trajet", href: PATHS.VOYAGER.SEARCH, icon: <Search className="h-5 w-5" /> },
    { label: "offres", href: PATHS.VOYAGER.OFFERS, icon: <Tag className="h-5 w-5" /> },
    { label: "mes billets", href: PATHS.VOYAGER.TICKETS, icon: <Ticket className="h-5 w-5" /> },
    { label: "Mes abonnements", href: PATHS.VOYAGER.SUBSCRIPTIONS, icon: <CreditCard className="h-5 w-5" /> },
    { label: "Profile", href: PATHS.VOYAGER.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);

  const adminNavItems = useMemo(() => [
    { label: "Tableau de bord", href: PATHS.ADMIN.DASHBOARD, icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Gares", href: PATHS.ADMIN.STATIONS, icon: <MapPin className="h-5 w-5" /> },
    { label: "Lignes", href: PATHS.ADMIN.LINES, icon: <Route className="h-5 w-5" /> },
    { label: "Trains", href: PATHS.ADMIN.TRAINS, icon: <Train className="h-5 w-5" /> },
    { label: "Personnel", href: PATHS.ADMIN.STAFF, icon: <Users className="h-5 w-5" /> },
    { label: "Horaires", href: PATHS.ADMIN.SCHEDULES, icon: <Calendar className="h-5 w-5" /> },
    { label: "Voyages", href: PATHS.ADMIN.TRIPS, icon: <Activity className="h-5 w-5" /> },
    { label: "Abonnements", href: PATHS.ADMIN.SUBSCRIPTIONS, icon: <CreditCard className="h-5 w-5" /> },
    { label: "Profile", href: PATHS.ADMIN.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);

  const agentNavItems = useMemo(() => [
    { label: "Demandes", href: PATHS.AGENT.SUBSCRIPTION_REQUESTS, icon: <Inbox className="h-5 w-5" /> },
    { label: "Profile", href: PATHS.STAFF.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);

  const controllerNavItems = useMemo(() => [
    { label: "Profile", href: PATHS.STAFF.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);

  return useMemo(() => {
    if (!isStaff) return voyagerNavItems;

    switch (user?.role) {
      case ROLES.ADMIN:
        return adminNavItems;
      case ROLES.AGENT:
        return agentNavItems;
      case ROLES.CONTROLLER:
        return controllerNavItems;
      default:
        return adminNavItems;
    }
  }, [isStaff, user?.role, voyagerNavItems, adminNavItems, agentNavItems, controllerNavItems]);
};
