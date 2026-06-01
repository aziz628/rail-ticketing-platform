import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Route, Calendar, Upload, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, selectItemsGenerator } from '@/components/ui/select';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { useAllLines } from '@/features/infrastructure/api/use-infrastructure';
import { useCreateSubscriptionRequestMutation, useSubscriptionCategories } from '../api/use-subscriptions';
import { SUBSCRIPTION_CATEGORY_LABELS } from '../constants/translations';
import { subscriptionRequestSchema, type SubscriptionRequestFormValues } from '../schemas';
import type { SubscriptionCategoryCode } from '../types/subscriptions';
import { useNotifications } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';
import { PATHS } from '@/app/paths';
import { useAuthStore } from '@/stores/auth';
import { SUBSCRIPTION_PROOF_ALLOWED_EXTENSIONS, SUBSCRIPTION_PROOF_MAX_SIZE } from '../schemas';
import { GuestLayout } from '@/components/layouts/GuestLayout';

const CATEGORY_PROOF_LABELS: Record<SubscriptionCategoryCode, string> = {
  SCOLAIRE: 'Attestation scolaire',
  UNIVERSITAIRE: 'Certificat de scolarité',
  PROFESSIONNEL: 'Justificatif professionnel',
  CIVIL: 'Photo CIN',
};

const CATEGORY_HELPERS: Record<SubscriptionCategoryCode, string> = {
  SCOLAIRE: 'Joignez le document PDF demandé par votre établissement.',
  UNIVERSITAIRE: 'Joignez votre certificat d\'inscription ou de scolarité.',
  PROFESSIONNEL: 'Joignez une preuve d\'emploi récente.',
  CIVIL: 'Joignez une photo lisible de votre CIN.',
};

const DURATION_LABELS = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
} as const;

const PROOF_ACCEPTED_EXTENSIONS = SUBSCRIPTION_PROOF_ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',');
const PROOF_HELPER_SUFFIX = `Formats acceptés : PDF, PNG, JPG, JPEG. Taille maximale : ${Math.round(
  SUBSCRIPTION_PROOF_MAX_SIZE / (1024 * 1024)
)} Mo.`;

const isSubscriptionCategoryCode = (value: string | undefined): value is SubscriptionCategoryCode =>
  value === 'SCOLAIRE' || value === 'UNIVERSITAIRE' || value === 'PROFESSIONNEL' || value === 'CIVIL';

export const SubscriptionRequestPage = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotifications((state) => state.addNotification);

  const selectedCategoryCode: SubscriptionCategoryCode = isSubscriptionCategoryCode(category)
    ? category
    : 'UNIVERSITAIRE';

  const { data: categories, isLoading: isLoadingCategories } = useSubscriptionCategories();
  const { data: lines = [], isLoading: isLoadingLines } = useAllLines();
  const createRequest = useCreateSubscriptionRequestMutation();

  const lineItems = selectItemsGenerator(lines);

  const selectedCategory = React.useMemo(() => {
    return categories?.find((entry) => entry.name === selectedCategoryCode) ?? null;
  }, [categories, selectedCategoryCode]);
  const requiresProof = selectedCategoryCode !== 'CIVIL';

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionRequestFormValues>({
    resolver: zodResolver(subscriptionRequestSchema),
    defaultValues: {
      categoryName: selectedCategoryCode,
      duration: 'MONTHLY',
      lineId: '',
      proofFile: undefined,
    },
  });

  React.useEffect(() => {
    reset({
      categoryName: selectedCategoryCode,
      duration: 'MONTHLY',
      lineId: '',
      proofFile: undefined,
    });
    setValue('categoryName', selectedCategoryCode);
  }, [reset, selectedCategoryCode, setValue]);

  const proofLabel = CATEGORY_PROOF_LABELS[selectedCategoryCode];
  const proofHelper = CATEGORY_HELPERS[selectedCategoryCode];

  const onSubmit = (values: SubscriptionRequestFormValues) => {
    createRequest.mutate(values, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'Votre demande a été envoyée avec succès.',
        });
        reset({
          categoryName: selectedCategoryCode,
          duration: 'MONTHLY',
          lineId: '',
          proofFile: undefined,
        });
      },
      onError: (err: any) => {
        if (!err._globallyHandled) {
          addNotification({
            type: 'error',
            text: err.response?.data?.message || 'Échec de l\'envoi de la demande.',
          });
        }
      },
    });
  };

  if (isLoadingCategories || isLoadingLines) {
    return (
      <GuestLayout>
        <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <RotatingLoader label="Chargement du formulaire..." />
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 pb-4 pt-0 dark:border-slate-800">
            <h1 className="sncft-page-title">
              Demande pour: Abonnement {SUBSCRIPTION_CATEGORY_LABELS[selectedCategoryCode] || selectedCategoryCode}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Remplissez le formulaire et joignez le justificatif uniquement si votre catégorie l'exige.
            </p>
            {/* Prices shown alongside duration choices below for clearer context */}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-5">
            <input type="hidden" {...register('categoryName')} />

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 sncft-heading-md">
                <Route className="h-5 w-5 text-primary" />
                Informations du trajet
              </h2>
              <div className="max-w-md space-y-2">
                <Label className="pb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ligne
                </Label>
                <Controller
                  name="lineId"
                  control={control}
                  render={({ field }) => (
                    <Select items={lineItems} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-12 rounded-lg border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-800">
                        <SelectValue placeholder="Choisir une ligne" />
                      </SelectTrigger>
                      <SelectContent>
                        {lines.map((line) => (
                          <SelectItem key={line.id} value={line.id}>
                            {line.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.lineId && <p className="text-xs font-medium text-red-500">{errors.lineId.message}</p>}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 sncft-heading-md">
                <Calendar className="h-5 w-5 text-primary" />
                Durée de l'abonnement
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(['MONTHLY', 'QUARTERLY'] as const).map((duration) => (
                  <label
                    key={duration}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                      watch('duration') === duration
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <input
                      type="radio"
                      value={duration}
                      className="h-5 w-5 text-primary focus:ring-primary"
                      {...register('duration')}
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {DURATION_LABELS[duration]}
                      </p>
                      {selectedCategory && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {duration === 'MONTHLY'
                            ? `${selectedCategory.monthlyPrice.toFixed(2)} DT / mois`
                            : `${selectedCategory.quarterlyPrice.toFixed(2)} DT / 3 mois`}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {requiresProof && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 sncft-heading-md">
                  <Upload className="h-5 w-5 text-primary" />
                  document justificatif requis
                </h2>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {proofLabel}
                  </p>
                  <Controller
                    name="proofFile"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <div className="flex min-h-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 transition-colors hover:border-primary dark:border-slate-700 dark:bg-slate-800/50">
                          <label className="flex w-full cursor-pointer items-center justify-center gap-3 text-center">
                            <input
                              type="file"
                              accept={PROOF_ACCEPTED_EXTENSIONS}
                              className="absolute inset-0 cursor-pointer opacity-0"
                              onChange={(event) => field.onChange(event.target.files?.[0])}
                            />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {field.value ? field.value.name : `Cliquez pour joindre ${proofLabel.toLowerCase()}`}
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  />
                  <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="mt-0.5 h-4 w-4" />
                    {proofHelper} {PROOF_HELPER_SUFFIX}
                  </p>
                  {errors.proofFile && <p className="text-xs font-medium text-red-500">{errors.proofFile.message}</p>}
                </div>
              </section>
            )}

            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
              <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                Limite: une demande en attente par ligne. 
                <br />
                Vérifiez que toute demande précédente pour ce trajet est résolue avant d'en soumettre une nouvelle.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row">
                {!isAuthenticated ? (
                  <div className="w-full space-y-3">
                    <Button
                      type="button"
                      onClick={() => navigate(PATHS.VOYAGER.LOGIN)}
                      className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                    >
                      Se connecter
                    </Button>
                    <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Connectez-vous pour envoyer votre demande
                    </p>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={createRequest.isPending}
                    className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                  >
                    {createRequest.isPending ? 'Envoi...' : 'Soumettre la demande'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </GuestLayout>
  );
};
