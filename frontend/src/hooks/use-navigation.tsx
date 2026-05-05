import { useMemo } from 'react';
import { Search, Tag, Ticket, CreditCard, User, MapPin, Train, Route, Users } from 'lucide-react';
import { PATHS } from '@/app/paths';
import { useViewMode } from '@/app/provider';

export const useNavigation = () => {
  const { isStaff } = useViewMode();

  const voyagerNavItems = useMemo(() => [
    { label: "Search Trips", href: PATHS.VOYAGER.SEARCH, icon: <Search className="h-5 w-5" /> },
    { label: "Offers", href: PATHS.VOYAGER.OFFERS, icon: <Tag className="h-5 w-5" /> },
    { label: "My Tickets", href: PATHS.VOYAGER.TICKETS, icon: <Ticket className="h-5 w-5" /> },
    { label: "My Subscriptions", href: PATHS.VOYAGER.SUBSCRIPTIONS, icon: <CreditCard className="h-5 w-5" /> },
    { label: "My Profile", href: PATHS.VOYAGER.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);

  const adminNavItems = useMemo(() => [
    { label: "Gares", href: PATHS.ADMIN.STATIONS, icon: <MapPin className="h-5 w-5" /> },
    { label: "Lignes", href: PATHS.ADMIN.LINES, icon: <Route className="h-5 w-5" /> },
    { label: "Trains", href: PATHS.ADMIN.TRAINS, icon: <Train className="h-5 w-5" /> },
    { label: "Personnel", href: PATHS.ADMIN.STAFF, icon: <Users className="h-5 w-5" /> },
    { label: "Mon Profil", href: PATHS.ADMIN.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);

  /*
  const controllerNavItems = useMemo(() => [
    { label: "Mon Profil", href: PATHS.ADMIN.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);

  const agentNavItems = useMemo(() => [
    { label: "Mon Profil", href: PATHS.ADMIN.PROFILE, icon: <User className="h-5 w-5" /> },
  ], []);
*/
  return isStaff ? adminNavItems : voyagerNavItems;
};
