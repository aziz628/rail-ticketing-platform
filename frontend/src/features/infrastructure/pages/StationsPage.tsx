import * as React from 'react';
import { Plus, Edit2, Trash2, MapPin} from 'lucide-react';
import { useStations, useDeleteStation } from '../api/use-infrastructure';
import type { Station } from '../types';
import { CreateStationModal } from '../components/CreateStationModal';
import { EditStationModal } from '../components/EditStationModal';
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
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/stores/notifications-store';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { useAuthStore } from '@/features/auth/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';

import { ConfirmationModal } from '@/components/common/ConfirmationModal';

export const StationsPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const { 
    data: stationsData, 
    isLoading: isLoadingStations,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useStations();
  const deleteStation = useDeleteStation();
  const addNotification = useNotifications((state) => state.addNotification);

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedStation, setSelectedStation] = React.useState<Station | null>(null);

  const [searchQuery] = React.useState('');

  const stations = React.useMemo(() => {
    return stationsData?.pages.flatMap((page) => page.content) || [];
  }, [stationsData]);

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (station: Station) => {
    setSelectedStation(station);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (station: Station) => {
    setSelectedStation(station);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedStation) return;
    
    deleteStation.mutate(selectedStation.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'La gare a été supprimée avec succès',
        });
        setIsDeleteModalOpen(false);
        setSelectedStation(null);
      },
      onError: (error: any) => {
        if (!error._globallyHandled) {
          addNotification({
            type: 'error',
            text: 'Impossible de supprimer cette station. Elle est probablement utilisée par une ligne.',
          });
        }
      },
    });
  };

  if (isLoadingStations) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-page">
        <RotatingLoader label="Chargement des stations..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Stations de transport
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les stations disponibles sur le réseau ferroviaire.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="primary-sncft gap-2">
            <Plus className="h-4 w-4" /> Nouvelle gare
          </Button>
        </div>

        <Card className="sncft-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la gare</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStations.map((station) => (
                <TableRow key={station.id} className="group">
                  <TableCell className="font-bold text-slate-900">
                    {station.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(station)}
                        className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        aria-label={`Modifier la gare ${station.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(station)}
                        disabled={!station.canDelete}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20"
                        aria-label={`Supprimer la gare ${station.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-40 text-center text-slate-500"
                  >
                    Aucune station trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Load More Block with improved visibility */}
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Affichage de {filteredStations.length} Stations
            </p>
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              label="Afficher plus"
              className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
            />
          </div>
        </Card>
      </div>

      <CreateStationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditStationModal
        station={selectedStation}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStation(null);
        }}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStation(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer la gare"
        description={`Êtes-vous sûr de vouloir supprimer la gare "${selectedStation?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteStation.isPending}
      />
    </PrivateLayout>
  );
};
