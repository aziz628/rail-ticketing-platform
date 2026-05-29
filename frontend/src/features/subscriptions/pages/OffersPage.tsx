import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { GuestLayout } from '@/components/layouts/GuestLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { PATHS } from '@/app/paths';
import { useSubscriptionCategories } from '../api/use-subscriptions';
import { SUBSCRIPTION_CATEGORY_LABELS } from '../constants/translations';
import type { SubscriptionCategoryCode, SubscriptionCategoryResponse } from '../types/subscriptions';

const CATEGORY_REQUIREMENTS: Record<SubscriptionCategoryCode, string> = {
  SCOLAIRE: 'justificatif scolaire',
  UNIVERSITAIRE: 'attestation d\'inscription',
  PROFESSIONNEL: 'Justificatif professionnel',
  CIVIL: '',
};

const CATEGORY_ORDER: SubscriptionCategoryCode[] = [
  'SCOLAIRE',
  'UNIVERSITAIRE',
  'PROFESSIONNEL',
  'CIVIL',
];

export const OffersPage = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading } = useSubscriptionCategories();

  // Memoize the ordered categories to avoid unnecessary computations on re-renders
  const orderedCategories = React.useMemo(() => {
    const byName = new Map((categories ?? []).map((category) => [category.name, category]));
    return CATEGORY_ORDER.map((name) => byName.get(name)).filter(Boolean) as SubscriptionCategoryResponse[];
  }, [categories]);

  return (
    <GuestLayout>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="sncft-page-title">
              Catégories d'abonnement
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Choisissez l'offre qui correspond à votre statut et à vos déplacements.
            </p>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <RotatingLoader label="Chargement des offres..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orderedCategories.map((category) => (
                <Card
                  key={category.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {SUBSCRIPTION_CATEGORY_LABELS[category.name] || category.name}
                      </h2>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary/5 px-3 py-1 text-sm font-semibold text-primary">
                        Mensuel {category.monthlyPrice.toFixed(2)} DT
                      </span>
                      <span className="rounded-full bg-primary/5 px-3 py-1 text-sm font-semibold text-primary">
                        Trimestriel {category.quarterlyPrice.toFixed(2)} DT
                      </span>
                    </div>

                    {category.name!== "CIVIL" && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Info className="h-4 w-4" />
                            <span>Pièces requises: {CATEGORY_REQUIREMENTS[category.name]}</span>
                        </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => navigate(`${PATHS.VOYAGER.SUBSCRIPTION_REQUEST}/${category.name}`)}
                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 md:w-40"
                  >
                    Faire une demande
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </GuestLayout>
  );
};
