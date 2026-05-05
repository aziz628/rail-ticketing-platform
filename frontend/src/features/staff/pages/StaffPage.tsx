import * as React from 'react';
import { Plus, Trash2, Users, ShieldCheck, UserCog } from 'lucide-react';
import { 
  useAgents, 
  useControllers, 
  useDeactivateStaff 
} from '../api/use-staff';
import { CreateAgentModal } from '../components/CreateAgentModal';
import { CreateControllerModal } from '../components/CreateControllerModal';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { useAuthStore } from '@/features/auth/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useNotifications } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export const StaffPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const addNotification = useNotifications((state) => state.addNotification);
  const deactivateStaff = useDeactivateStaff();

  const [activeTab, setActiveTab] = React.useState<'agents' | 'controllers'>('agents');
  const [isCreateAgentOpen, setIsCreateAgentOpen] = React.useState(false);
  const [isCreateControllerOpen, setIsCreateControllerOpen] = React.useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<{ id: string; name: string } | null>(null);

  const agentsQuery = useAgents();
  const controllersQuery = useControllers();

  const currentQuery = activeTab === 'agents' ? agentsQuery : controllersQuery;
  
  const staffList = React.useMemo(() => {
    return currentQuery.data?.pages.flatMap((page) => page.content) || [];
  }, [currentQuery.data, activeTab]);

  const handleDeactivate = () => {
    if (!selectedStaff) return;
    deactivateStaff.mutate(selectedStaff.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: `${activeTab === 'agents' ? 'L\'agent' : 'Le contrôleur'} a été désactivé avec succès`,
        });
        setIsDeactivateModalOpen(false);
        setSelectedStaff(null);
      },
      onError: (error: any) => {
        if (!error._globallyHandled) {
          addNotification({
            type: 'error',
            text: error.response?.data?.message || 'Erreur lors de la désactivation',
          });
        }
      },
    });
  };

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCog className="h-6 w-6 text-primary" />
              Gestion du Personnel
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gérez vos agents de guichet et vos contrôleurs de ligne.
            </p>
          </div>
          <Button 
            onClick={() => activeTab === 'agents' ? setIsCreateAgentOpen(true) : setIsCreateControllerOpen(true)}
            className="primary-sncft gap-2"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'agents' ? 'Nouvel agent' : 'Nouveau contrôleur'}
          </Button>
        </div>

        {/* Tab Switcher - Styled to match SNCFT Dashboard depth */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'agents' 
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('controllers')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'controllers' 
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Contrôleurs
          </button>
        </div>

        {/* Data Table */}
        <Card className="sncft-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom & E-mail</TableHead>
                {activeTab === 'controllers' && (
                  <TableHead>Ligne Assignée</TableHead>
                )}
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={activeTab === 'controllers' ? 3 : 2} className="h-40 text-center">
                    <RotatingLoader label="Chargement..." />
                  </TableCell>
                </TableRow>
              ) : staffList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeTab === 'controllers' ? 3 : 2}
                    className="h-40 text-center text-slate-500"
                  >
                    Aucun membre du personnel trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                staffList.map((member) => (
                  <TableRow key={member.id} className="group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{member.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">{member.email}</span>
                      </div>
                    </TableCell>
                    {activeTab === 'controllers' && (
                      <TableCell className="font-medium text-slate-600">
                        {(member as any).assignedLineName || (
                          <span className="text-slate-300 italic text-xs">Non assignée</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStaff(member);
                            setIsDeactivateModalOpen(true);
                          }}
                          disabled={!member.canDelete}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20"
                          aria-label="Désactiver"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Load More Block - Standardized across modules */}
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Affichage de {staffList.length} {activeTab === 'agents' ? 'Agents' : 'Contrôleurs'}
            </p>
            <LoadMoreButton
              hasNextPage={currentQuery.hasNextPage || false}
              isFetchingNextPage={currentQuery.isFetchingNextPage}
              fetchNextPage={() => currentQuery.fetchNextPage()}
              label="Afficher plus"
              className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
            />
          </div>
        </Card>
      </div>

      <CreateAgentModal 
        isOpen={isCreateAgentOpen} 
        onClose={() => setIsCreateAgentOpen(false)} 
      />
      
      <CreateControllerModal 
        isOpen={isCreateControllerOpen} 
        onClose={() => setIsCreateControllerOpen(false)} 
      />

      <ConfirmationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setSelectedStaff(null);
        }}
        onConfirm={handleDeactivate}
        title={`Désactiver ${activeTab === 'agents' ? 'l\'agent' : 'le contrôleur'}`}
        description={`Êtes-vous sûr de vouloir désactiver "${selectedStaff?.name}" ? Cette action révoquera son accès au système.`}
        confirmText="Désactiver"
        variant="danger"
        isLoading={deactivateStaff.isPending}
      />
    </PrivateLayout>
  );
};
