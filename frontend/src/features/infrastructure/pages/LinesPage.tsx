import * as React from 'react';
import { Plus, Trash2, ChevronDown, Route } from 'lucide-react';
import { useLines, useDeleteLine, useStations } from '../api/use-infrastructure';
import type { Line } from '../types';
import { CreateLineModal } from '../components/CreateLineModal';
import { Button } from '@/components/ui/button';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useNotifications } from '@/stores/notifications-store';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { useAuthStore } from '@/features/auth/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';

export const LinesPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const { 
    data: linesData, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useLines();
  
  // Need stations count for modal access rule
  const { data: stationsData } = useStations();
  const totalStations = React.useMemo(() => {
    return stationsData?.pages.flatMap(p => p.content).length || 0;
  }, [stationsData]);

  const deleteLine = useDeleteLine();
  const addNotification = useNotifications((state) => state.addNotification);

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedLine, setSelectedLine] = React.useState<Line | null>(null);
  const [expandedLines, setExpandedLines] = React.useState<Set<string>>(new Set());

  const handleOpenCreateModal = () => {
    if (totalStations < 2) {
      addNotification({
        type: 'error',
        text: 'Vous devez avoir au moins 2 gares pour créer une ligne.',
      });
      return;
    }
    setIsCreateModalOpen(true);
  };

  const lines = React.useMemo(() => {
    return linesData?.pages.flatMap((page) => page.content) || [];
  }, [linesData]);

  const toggleLine = (id: string) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLines(newExpanded);
  };

  const handleDelete = () => {
    if (!selectedLine) return; 
    deleteLine.mutate(selectedLine.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'La ligne a été supprimée avec succès',
        });
        setIsDeleteModalOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <PrivateLayout navItems={navItems} user={user!}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <RotatingLoader />
        </div>
      </PrivateLayout>
    );
  }

  return (
    <PrivateLayout navItems={navItems} user={user!}>
      <div className="w-full space-y-6">

        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Lignes Ferroviaires</h2>
            <p className="text-sm text-slate-500 mt-1">Les lignes sont des parcours immuables de gares.</p>
          </div>
          <Button 
            onClick={handleOpenCreateModal}
            className="gap-2 h-11 px-5 font-bold shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Créer une ligne
          </Button>
        </div>

        {/* List of lines */}
        <div className="space-y-4">
          {lines.map((line) => {
            const isExpanded = expandedLines.has(line.id);
            const totalKm = line.nodes[line.nodes.length - 1]?.kmFromSource || 0;

            return (
              <div 
                key={line.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md"
              >
                <div 
                  onClick={() => toggleLine(line.id)}
                  className="p-5 flex justify-between items-center cursor-pointer group"
                >
                  {/* line details */}
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {line.name}
                      </h3>
                      {/* line nodes count and total km */}
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {line.nodes.length} Gares • {totalKm} KM Total
                        </p>
                        {/* expand nodes button */}
                        <span 
                        className={cn(
                          "text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 inline-flex items-center gap-1 rounded font-bold transition-all",
                          isExpanded && "bg-primary/10 text-primary"
                        )}>
                          Voir Nodes
                          <ChevronDown className={cn(
                            "h-3.5 w-3.5 transition-transform duration-300",
                            isExpanded ? "rotate-0" : "-rotate-90"
                          )} />
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLine(line);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                    aria-label={`Supprimer la ligne ${line.name}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* expanded line nodes */}
                {isExpanded && (
                  <div className="px-8 pb-8 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative space-y-6">
                      {/* Vertical Line */}
                      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                      
                      {line.nodes.map((node, index) => {
                        const isSource = index === 0;
                        const isDestination = index === line.nodes.length - 1;
                        
                        return (
                          <div key={index} className="relative flex items-center gap-6" style={index==0?{marginTop:0}:{}}>
                            <div className={cn(
                              "w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 z-10 flex items-center justify-center",
                              isSource ? "border-primary" : isDestination ? "border-emerald-500" : "border-slate-300 dark:border-slate-700"
                            )}>
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSource ? "bg-primary" : isDestination ? "bg-emerald-500" : "bg-slate-400"
                              )} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {node.stationName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {isSource ? 'Source' : isDestination ? 'Destination' : 'Intermédiaire'} • {node.kmFromSource} KM
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Load more button */}
        <LoadMoreButton
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          label="Charger plus de lignes"
        />
        {/* No lines found */}
        {!isLoading && lines.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Route className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aucune ligne trouvée</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              Commencez par créer votre première ligne ferroviaire.
            </p>
          </div>
        )}
      </div>

      <CreateLineModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la ligne"
        description={`Êtes-vous sûr de vouloir supprimer la ligne "${selectedLine?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteLine.isPending}
      />
    </PrivateLayout>
  );
};
