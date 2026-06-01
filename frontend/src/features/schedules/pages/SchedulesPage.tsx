import * as React from 'react';
import { Plus, Clock, History, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, selectItemsGenerator, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllLines } from '@/features/infrastructure/api/use-infrastructure';
import { SchedulesTable } from '../components/SchedulesTable';
import { CreateScheduleModal } from '../components/CreateScheduleModal';
import { ReassignControllerModal } from '../components/ReassignControllerModal';
import { DeactivateScheduleModal } from '../components/DeactivateScheduleModal';
import { useSchedulesQuery, useDeleteScheduleMutation } from '../api/schedules';
import { useAuthStore } from '@/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useNotifications } from '@/stores/notifications-store';
import type { Schedule } from '../types';
import type { Line } from '@/features/infrastructure/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

type ScheduleType = 'ACTIVE' | 'INACTIVE';

const ScheduleType = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}as const;

export function SchedulesPage() {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const addNotification = useNotifications((state) => state.addNotification);
  const [activeTab, setActiveTab] = React.useState<ScheduleType>(ScheduleType.ACTIVE);
  const [selectedLineId, setSelectedLineId] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [reassignTarget, setReassignTarget] = React.useState<Schedule | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Schedule | null>(null);

  // Data fetching
  const { data: lines = [] } = useAllLines();
  // lines as items for the select component
  const linesItems = [{ value: "", label: "Toutes les lignes" }, ...selectItemsGenerator<Line>(lines)] 

  const { data: schedulesData, isLoading } = useSchedulesQuery({ 
    status: activeTab,
    lineId: selectedLineId || undefined
  });
  const deleteMutation = useDeleteScheduleMutation();

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content sncft-page-section">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="sncft-page-header">
            <h1 className="sncft-page-title">
              Gestion des Horaires
            </h1>
            <p className="sncft-page-subtitle">
              Gérez les règles de génération automatique des voyages et l'assignation du personnel.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="primary-sncft gap-2">
            <Plus className="h-4 w-4" />
            Créer un horaire
          </Button>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Tab Switcher */}
          <div className="sncft-tabs-admin">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={cn(
                'sncft-tab-admin',
                activeTab === 'ACTIVE'
                  ? 'sncft-tab-admin-active'
                  : 'sncft-tab-admin-inactive'
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Actifs
            </button>
            <button
              onClick={() => setActiveTab('INACTIVE')}
              className={cn(
                'sncft-tab-admin',
                activeTab === 'INACTIVE'
                  ? 'sncft-tab-admin-active'
                  : 'sncft-tab-admin-inactive'
              )}
            >
              <History className="h-3.5 w-3.5" />
              Désactivés
            </button>
          </div>

          {/* Line Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <Filter className="h-4 w-4 text-slate-500" />
            </div>
            <Select value={selectedLineId} onValueChange={setSelectedLineId} items={linesItems}>
              <SelectTrigger className="w-full md:w-[250px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Toutes les lignes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les lignes</SelectItem>
                {lines.map((line) => (
                  <SelectItem key={line.id} value={line.id} >
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Table Content */}
        <Card className="sncft-card  p-0">
          <SchedulesTable
            schedules={schedulesData?.content || []}
            isLoading={isLoading}
            onReassign={setReassignTarget}
            onDeactivate={setDeactivateTarget}
            onDelete={setDeleteTarget}
            activeTab={activeTab}
          />
        </Card>

        {/* Modals */}
        <CreateScheduleModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <ReassignControllerModal 
          schedule={reassignTarget}
          isOpen={!!reassignTarget}
          onClose={() => setReassignTarget(null)}
        />

        {/* Deactivation Date Selection Modal */}
        <DeactivateScheduleModal
          schedule={deactivateTarget}
          isOpen={!!deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
        />

        {/* Hard Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                addNotification({ type: 'success', text: 'Horaire supprimé définitivement' });
                setDeleteTarget(null);
              },
              onError: (error: any) => {
                addNotification({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la suppression' });
              },
            });
          }}
          title="Supprimer l'horaire"
          description={`Êtes-vous sûr de vouloir supprimer définitivement l'horaire de la ligne "${deleteTarget?.lineName}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PrivateLayout>
  );
}
