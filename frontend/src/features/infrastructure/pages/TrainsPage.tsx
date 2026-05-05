import * as React from 'react';
import { Plus, Trash2, Train as TrainIcon, Armchair, Edit } from 'lucide-react';
import { useTrains, useDeleteTrain } from '../api/use-infrastructure';
import type { Train } from '../types';
import { CreateTrainModal } from '../components/CreateTrainModal';
import { EditTrainInfoModal } from '../components/EditTrainInfoModal';
import { EditClassPriceModal } from '../components/EditClassPriceModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useNotifications } from '@/stores/notifications-store';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { useAuthStore } from '@/features/auth/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { cn } from '@/lib/utils';

export const TrainsPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const { 
    data: trainsData, 
    isLoading: isLoadingTrains,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useTrains();
  const deleteTrain = useDeleteTrain();
  const addNotification = useNotifications((state) => state.addNotification);

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = React.useState(false);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  
  const [selectedTrain, setSelectedTrain] = React.useState<Train | null>(null);
  const [selectedClass, setSelectedClass] = React.useState<{ id: string; type: string; price: number } | null>(null);

  const trains = React.useMemo(() => {
    return trainsData?.pages.flatMap((page) => page.content) || [];
  }, [trainsData]);

  const handleConfirmDelete = () => {
    if (!selectedTrain) return;
    
    deleteTrain.mutate(selectedTrain.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'Le train a été supprimé avec succès',
        });
        setIsDeleteModalOpen(false);
        setSelectedTrain(null);
      },
      onError: (error: any) => {
        if (!error._globallyHandled) {
          addNotification({
            type: 'error',
            text: 'Impossible de supprimer ce train.',
          });
        }
      },
    });
  };

  if (isLoadingTrains) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-page">
        <RotatingLoader label="Chargement des trains..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* content header  */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* title and subtitle  */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrainIcon className="h-6 w-6 text-primary" />
              Types de Trains
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les trains et les capacités de leurs classes de sièges.
            </p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 flex items-center gap-2 transition-all"
          >
            <Plus className="h-4 w-4" /> Nouveau train
          </button>
        </div>

        {/* content body : list of trains cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trains?.map((train) => (
            <div
              key={train.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                {/* train name and base price increase percentage */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{train.name}</h3>
                  <span className="inline-block mt-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase">
                    +{train.basePriceIncreasePercentage}% Prix de base
                  </span>
                </div>
                {/* edit and delete buttons  */}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedTrain(train);
                      setIsEditInfoModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-primary rounded transition-colors"
                    aria-label={`Modifier le train ${train.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTrain(train);
                      setIsDeleteModalOpen(true);
                    }}
                    disabled={!train.canDelete}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    aria-label={`Supprimer le train ${train.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* list of seat classes  */}
              <div className="space-y-2 mt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Classes Configurées
                </h4>
                {train.seatClasses.map((sc) => (
                  <div
                    key={sc.id}
                    className="group/item flex flex-wrap items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 gap-2 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Armchair className={cn(
                        "h-4 w-4",
                        sc.type === 'FIRST' ? "text-amber-500" : sc.type === 'COMFORT' ? "text-purple-500" : "text-slate-400"
                      )} />
                      <span className="text-sm font-bold">{sc.type} Class</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 font-bold">
                        <span>{sc.capacity} Sièges</span>
                        <span className="text-slate-400">+{sc.priceIncreasePercentage}%</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTrain(train);
                          setSelectedClass({ id: sc.id, type: sc.type, price: sc.priceIncreasePercentage });
                          setIsEditPriceModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-primary rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-0 group-hover/item:opacity-100 transition-all shadow-sm"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {trains?.length === 0 && (
            <div className="col-span-2 py-20 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-2xl">
              Aucun train configuré.
            </div>
          )}
        </div>

        <LoadMoreButton
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          label="Afficher plus de trains"
          className="px-8 text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
        />
      </div>

      <CreateTrainModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditTrainInfoModal
        train={selectedTrain}
        isOpen={isEditInfoModalOpen}
        onClose={() => {
          setIsEditInfoModalOpen(false);
          setSelectedTrain(null);
        }}
      />

      <EditClassPriceModal
        trainId={selectedTrain?.id || null}
        seatClass={selectedClass}
        isOpen={isEditPriceModalOpen}
        onClose={() => {
          setIsEditPriceModalOpen(false);
          setSelectedClass(null);
        }}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTrain(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer le modèle"
        description={`Voulez-vous vraiment supprimer le train "${selectedTrain?.name}" ?`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteTrain.isPending}
      />
    </PrivateLayout>
  );
};
