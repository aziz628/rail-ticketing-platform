import * as React from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useAuthStore } from '@/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { useNotifications } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_CATEGORY_LABELS } from '../constants/translations';
import { SubscriptionRequestProofModal } from '../components/SubscriptionRequestProofModal';
import type { StaffSubscriptionRequestResponse, SubscriptionRequestStatus } from '../types/subscriptions';
import {
  useApproveSubscriptionRequestMutation,
  useRejectSubscriptionRequestMutation,
  useStaffSubscriptionRequests,
  useSubscriptionRequestProof,
} from '../api/use-subscriptions';

const TAB_LABELS: Record<'awaiting' | 'handled', string> = {
  awaiting: 'En attente',
  handled: 'Traitées',
};

const REQUEST_STATUS_LABELS: Record<SubscriptionRequestStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
};

const DURATION_LABELS = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  ANNUAL: 'Annuel',
} as const;



const formatDate = (value: string) => {
  try {
    return format(parseISO(value), 'dd MMM yyyy', { locale: fr });
  } catch {
    return value;
  }
};

export const AgentRequestsPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation() ?? [];
  const addNotification = useNotifications((state) => state.addNotification);

  const [activeTab, setActiveTab] = React.useState<'awaiting' | 'handled'>('awaiting');
  const [selectedRequest, setSelectedRequest] = React.useState<StaffSubscriptionRequestResponse | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');

  const pendingQuery = useStaffSubscriptionRequests('PENDING', activeTab === 'awaiting');
  const approvedQuery = useStaffSubscriptionRequests('APPROVED', activeTab === 'handled');
  const rejectedQuery = useStaffSubscriptionRequests('REJECTED', activeTab === 'handled');
  const approveMutation = useApproveSubscriptionRequestMutation();
  const rejectMutation = useRejectSubscriptionRequestMutation();

  const proofQuery = useSubscriptionRequestProof(selectedRequest?.id ?? null, Boolean(selectedRequest && activeTab === 'awaiting'));

  const proofBlob = proofQuery.data;
  const proofUrl = React.useMemo(() => {
    if (!proofBlob) return null;
    return window.URL.createObjectURL(proofBlob);
  }, [proofBlob]);

  React.useEffect(() => {
    return () => {
      if (proofUrl) {
        window.URL.revokeObjectURL(proofUrl);
      }
    };
  }, [proofUrl]);

  const awaitingRequests = React.useMemo(
    () => pendingQuery.data?.pages.flatMap((page) => page.content) || [],
    [pendingQuery.data]
  );

  const handledRequests = React.useMemo(() => {
    const approved = approvedQuery.data?.pages.flatMap((page) => page.content) || [];
    const rejected = rejectedQuery.data?.pages.flatMap((page) => page.content) || [];

    return [...approved, ...rejected].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [approvedQuery.data, rejectedQuery.data]);

  const visibleRequests = activeTab === 'awaiting' ? awaitingRequests : handledRequests;
  const isLoading =
    activeTab === 'awaiting'
      ? pendingQuery.isLoading
      : approvedQuery.isLoading || rejectedQuery.isLoading;

  const hasNextPage =
    activeTab === 'awaiting'
      ? pendingQuery.hasNextPage || false
      : (approvedQuery.hasNextPage || false) || (rejectedQuery.hasNextPage || false);

  const isFetchingNextPage =
    activeTab === 'awaiting'
      ? pendingQuery.isFetchingNextPage
      : approvedQuery.isFetchingNextPage || rejectedQuery.isFetchingNextPage;

  const loadMore = async () => {
    if (activeTab === 'awaiting') {
      await pendingQuery.fetchNextPage();
      return;
    }

    await Promise.all([
      approvedQuery.hasNextPage ? approvedQuery.fetchNextPage() : Promise.resolve(),
      rejectedQuery.hasNextPage ? rejectedQuery.fetchNextPage() : Promise.resolve(),
    ]);
  };

  const closePreview = () => {
    setSelectedRequest(null);
  };

  const openRequest = (request: StaffSubscriptionRequestResponse) => {
    setSelectedRequest(request);
    setRejectReason('');
  };

  const handleApprove = () => {
    if (!selectedRequest) return;

    approveMutation.mutate(selectedRequest.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'La demande a été approuvée avec succès.',
        });
        closePreview();
      },
      onError: (error: any) => {
        if (!error._globallyHandled) {
          addNotification({
            type: 'error',
            text: error.response?.data?.message || 'Erreur lors de l\'approbation de la demande.',
          });
        }
      },
    });
  };

  const handleRejectSubmit = () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    rejectMutation.mutate(
      { requestId: selectedRequest.id, data: { rejectReason: rejectReason.trim() } },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            text: 'La demande a été rejetée avec succès.',
          });
          setIsRejectDialogOpen(false);
          closePreview();
        },
        onError: (error: any) => {
          if (!error._globallyHandled) {
            addNotification({
              type: 'error',
              text: error.response?.data?.message || 'Erreur lors du rejet de la demande.',
            });
          }
        },
      }
    );
  };

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content-wide sncft-page-section">
        <div className="sncft-page-header">
          <h1 className="sncft-page-title">
            Demandes d'abonnement
          </h1>
          <p className="sncft-page-subtitle">
            Traitez les demandes d'abonnement et inspectez leur justificatif.
          </p>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 py-0">
          <div className="sncft-tabs px-8 bg-white dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('awaiting')}
              className={cn(
                'sncft-tab text-xs',
                activeTab === 'awaiting'
                  ? 'sncft-tab-active'
                  : 'sncft-tab-inactive'
              )}
            >
              {TAB_LABELS.awaiting}
            </button>
            <button
              onClick={() => setActiveTab('handled')}
              className={cn(
                'sncft-tab text-xs',
                activeTab === 'handled'
                  ? 'sncft-tab-active'
                  : 'sncft-tab-inactive'
              )}
            >
              {TAB_LABELS.handled}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                <tr>
                  <th className="px-6 py-3">Voyageur</th>
                  <th className="px-6 py-3">Catégorie</th>
                  <th className="px-6 py-3">Ligne</th>
                  <th className="px-6 py-3">Durée</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">{activeTab === 'awaiting' ? 'Actions' : 'Statut'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="h-40 text-center">
                      <RotatingLoader label="Chargement des demandes..." />
                    </td>
                  </tr>
                ) : visibleRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-40 text-center text-slate-500">
                      Aucune demande trouvée.
                    </td>
                  </tr>
                ) : (
                  visibleRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">{request.voyagerName}</td>
                      <td className="px-6 py-3">
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {SUBSCRIPTION_CATEGORY_LABELS[request.categoryName] || request.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">{request.lineName}</td>
                      <td className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">
                        {DURATION_LABELS[request.duration] }
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-slate-600">{formatDate(request.createdAt)}</td>
                      <td className="px-6 py-3 text-right">
                        {activeTab === 'awaiting' ? (
                          <Button
                            type="button"
                            onClick={() => openRequest(request)}
                            className="rounded-lg bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-900/10 hover:scale-105 transition-all"
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Examiner
                          </Button>
                        ) : (
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                              request.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : request.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            )}
                          >
                            {REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {activeTab === 'awaiting'
                ? `En attente: ${awaitingRequests.length} demandes`
                : `Traitées: ${handledRequests.length} demandes`}
            </p>
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={() => loadMore()}
              label="Afficher plus"
              className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
            />
          </div>
        </Card>
      </div>

      <SubscriptionRequestProofModal
        request={selectedRequest}
        proofBlob={proofBlob}
        proofUrl={proofUrl}
        isLoading={proofQuery.isLoading}
        isError={Boolean(proofQuery.isError)}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        onClose={closePreview}
        onReject={() => setIsRejectDialogOpen(true)}
        onApprove={handleApprove}
      />

      <Dialog open={isRejectDialogOpen} onOpenChange={(open) => !open && setIsRejectDialogOpen(false)}>
        <DialogContent className="sncft-modal-medium">
          <DialogHeader>
            <DialogTitle className="sncft-modal-title">
              Motif du rejet
            </DialogTitle>
            <DialogDescription className="pt-2">
              Obligatoire pour notifier l'utilisateur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-1">
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Ex: Document expiré, CIN illisible, certificat invalide..."
            />
          </div>

          <DialogFooter className="pt-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrivateLayout>
  );
};
