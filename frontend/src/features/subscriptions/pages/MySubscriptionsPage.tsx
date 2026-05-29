import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock3, CreditCard, RefreshCw, Ticket } from 'lucide-react';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useAuthStore } from '@/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { cn } from '@/lib/utils';
import { PATHS } from '@/app/paths';
import {
  SUBSCRIPTION_CATEGORY_LABELS,
  DURATION_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from '../constants/translations';
import type {
  SubscriptionRequestResponse,
  SubscriptionResponse,
  SubscriptionFilter,
} from '../types/subscriptions';
import {
  useInitiateSubscriptionPaymentMutation,
  useMySubscriptionRequests,
  useMySubscriptions,
} from '../api/use-subscriptions';

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  // format the date in the format "dd MMM yyyy" with the month in letters and in french locale
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const CURRENT_FILTER: SubscriptionFilter = 'CURRENT';
const EXPIRED_FILTER: SubscriptionFilter = 'EXPIRED';

const SubscriptionCard = ({
  subscription,
  onAction,
  actionLabel,
  isActionPending,
}: {
  subscription: SubscriptionResponse;
  onAction?: (subscription: SubscriptionResponse) => void;
  actionLabel?: string;
  isActionPending?: boolean;
}) => {
  const isAwaitingPayment = subscription.status === 'AWAITING_PAYMENT';
  const isCivil = subscription.categoryName === 'CIVIL';
  const showAction = Boolean(onAction) && (isAwaitingPayment || (subscription.status === 'EXPIRED' && isCivil));

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4',
        subscription.status === 'AWAITING_PAYMENT'
          ? 'border-blue-200 dark:border-blue-900/50'
          : 'border-slate-200 dark:border-slate-800',
        subscription.status === 'EXPIRED' ? 'opacity-75' : ''
      )}
    >
      <div>
        {/* Subscription Header with Status label */}
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">
            {SUBSCRIPTION_CATEGORY_LABELS[subscription.categoryName] || subscription.categoryName}
          </h3>
          <span
            className={cn(
              'px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider',
              subscription.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : subscription.status === 'AWAITING_PAYMENT'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <Ticket className="h-4 w-4" />
          <span>{subscription.lineName}</span>
        </div>

        {/* expire date or status based on subscription status */}
        <p className="text-slate-400 text-xs mt-2 uppercase tracking-tighter">
          {subscription.status === 'EXPIRED'
            ? `Expiré: ${formatDate(subscription.expireDate)}`
            :   subscription.status === 'AWAITING_PAYMENT'
                ? 'Statut: Approuvé par l\'agent'
                : `Expire: ${formatDate(subscription.expireDate)}`}
        </p>
      </div>

     {/* Action button for pending payment or renewing expired civil subscription */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-4 md:mt-0">
        {showAction && (
          <Button
            type="button"
            onClick={() => onAction?.(subscription)}
            disabled={isActionPending}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors',
              isAwaitingPayment
                ? 'bg-primary text-white hover:opacity-90'
                : 'border-2 border-primary text-primary bg-transparent hover:bg-primary/5'
            )}
          >
            {isAwaitingPayment ? <CreditCard className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

const RequestCard = ({ request }: { request: SubscriptionRequestResponse }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div className="space-y-3">
        {/* Request Header with Status label */}
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {SUBSCRIPTION_CATEGORY_LABELS[request.categoryName] || request.categoryName}
            </h3>
            <span
              className={cn(
                'px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider',
                request.status === 'PENDING'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : request.status === 'APPROVED'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {REQUEST_STATUS_LABELS[request.status]}
            </span>
          </div>
        
        {/* Request details */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              {request.lineName}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {DURATION_LABELS[request.duration]}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(request.createdAt)}
            </span>
          </div>
        </div>

        {/* reject reason for rejected requests */}
        <div className="space-y-2 text-sm sm:max-w-sm sm:text-right">
          {request.status === 'REJECTED' && (
            <div className="space-y-1">
              <p className="text-red-600 dark:text-red-400">Demande rejetée.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{request.rejectReason || 'Aucun motif renseigné.'}</p>
            </div>
          )}
        </div>
      </div>
  );
};

export const MySubscriptionsPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation() ?? [];
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'active' | 'requests' | 'expired'>('active');
  const initiatePaymentMutation = useInitiateSubscriptionPaymentMutation();

  // Fetch subscriptions and requests based on the active tab.
  const currentQuery = useMySubscriptions(CURRENT_FILTER, activeTab === 'active');
  const requestsQuery = useMySubscriptionRequests(activeTab === 'requests');
  const expiredQuery = useMySubscriptions(EXPIRED_FILTER, activeTab === 'expired');

  // Memoize the flattened subscription lists to avoid unnecessary computations on re-renders
  const currentSubscriptions = React.useMemo(
    () => currentQuery.data?.pages.flatMap((page) => page.content) || [],
    [currentQuery.data]
  );
  const requestSubscriptions = React.useMemo(
    () => requestsQuery.data?.pages.flatMap((page) => page.content) || [],
    [requestsQuery.data]
  );
  const expiredSubscriptions = React.useMemo(
    () => expiredQuery.data?.pages.flatMap((page) => page.content) || [],
    [expiredQuery.data]
  );

  // navigates to the payment page with the PSP session ID if successful
  const handleStartPayment = (subscription: SubscriptionResponse) => {
    initiatePaymentMutation.mutate(subscription.id, {
      onSuccess: (response) => {
        navigate(`${PATHS.VOYAGER.PAYMENT}/${response.pspSessionId}?targetType=SUBSCRIPTION`);
      },
    });
  };

  const loadMoreCurrent = async () => {
    await currentQuery.fetchNextPage();
  };

  const loadMoreRequests = async () => {
    await requestsQuery.fetchNextPage();
  };

  const loadMoreExpired = async () => {
    await expiredQuery.fetchNextPage();
  };

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content-wide sncft-page-section">
       {/* Page Header */}
        <div className="sncft-page-header">
          <h1 className="sncft-page-title">
            Mes abonnements
          </h1>
          <p className="sncft-page-subtitle">
            Suivez vos abonnements, vos demandes et les abonnements expirés.
          </p>
        </div>
        
        {/* Content */}
        <div className="space-y-6">
          
        {/* Tabs */}
          <div className="sncft-tabs">
            <div className="flex gap-8">
              {(
                [
                  { key: 'active', label: 'En cours', },
                  { key: 'requests', label:'Demandes'  },
                  { key: 'expired', label: 'Expirés' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'sncft-tab',
                    activeTab === tab.key
                      ? 'sncft-tab-active'
                      : 'sncft-tab-inactive'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
            
        {/* Tab Content */}
          <div className="flex flex-col gap-4">

            {/* Active Subscriptions Tab */}
            {activeTab === 'active' && (
              <>
                {currentQuery.isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <RotatingLoader label="Chargement des abonnements..." />
                  </div>
                ) : currentSubscriptions.length === 0 ? (
                  <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <Ticket className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="sncft-heading-md">Aucun abonnement trouvé</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Vous n'avez aucun abonnement en cours pour le moment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentSubscriptions.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onAction={subscription.status === 'AWAITING_PAYMENT' ? handleStartPayment : undefined}
                        actionLabel={subscription.status === 'AWAITING_PAYMENT' ? 'Payer maintenant' : undefined}
                        isActionPending={initiatePaymentMutation.isPending}
                      />
                    ))}
                  </>
                )}

                {/*pagination for current subscriptions*/}
                {currentQuery.hasNextPage && (
                  <div className="flex justify-center pt-4">
                    <LoadMoreButton
                      hasNextPage={Boolean(currentQuery.hasNextPage)}
                      isFetchingNextPage={currentQuery.isFetchingNextPage}
                      fetchNextPage={loadMoreCurrent}
                      label="Afficher plus"
                      className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                    />
                  </div>
                )}
              </>
            )}
            
            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {requestsQuery.isLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <RotatingLoader label="Chargement des demandes..." />
                  </div>
                ) : requestSubscriptions.length === 0 ? (
                  <Card className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                    Aucune demande trouvée.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {requestSubscriptions.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}

                {requestsQuery.hasNextPage && (
                  <div className="flex justify-center pt-4">
                    <LoadMoreButton
                      hasNextPage={Boolean(requestsQuery.hasNextPage)}
                      isFetchingNextPage={requestsQuery.isFetchingNextPage}
                      fetchNextPage={loadMoreRequests}
                      label="Afficher plus"
                      className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Expired Subscriptions Tab */}
            {activeTab === 'expired' && (
              <div className="space-y-4">
                {expiredQuery.isLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <RotatingLoader label="Chargement des abonnements expirés..." />
                  </div>
                ) : expiredSubscriptions.length === 0 ? (
                  <Card className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                    Aucun abonnement expiré.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {expiredSubscriptions.map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                        onAction={subscription.categoryName === 'CIVIL' ? handleStartPayment : undefined}
                        actionLabel="Renouveler"
                        isActionPending={initiatePaymentMutation.isPending}
                      />
                    ))}
                  </div>
                )}

                {expiredQuery.hasNextPage && (
                  <div className="flex justify-center pt-4">
                    <LoadMoreButton
                      hasNextPage={Boolean(expiredQuery.hasNextPage)}
                      isFetchingNextPage={expiredQuery.isFetchingNextPage}
                      fetchNextPage={loadMoreExpired}
                      label="Afficher plus"
                      className="text-primary border-primary/20 hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
};
