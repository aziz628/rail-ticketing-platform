import * as React from 'react';
import { Pencil } from 'lucide-react';
import { PrivateLayout } from '@/components/layouts/PrivateLayout';
import { useAuthStore } from '@/stores/auth';
import { useNavigation } from '@/hooks/use-navigation';
import { useSubscriptionCategories, useUpdateSubscriptionCategory } from '../api/use-subscriptions';
import { SUBSCRIPTION_CATEGORY_LABELS } from '../constants/translations';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditCategoryModal } from '../components/EditCategoryModal';
import { useNotifications } from '@/stores/notifications-store';
import type { SubscriptionCategoryResponse } from '../types/subscriptions';

export const AdminCategoriesPage = () => {
  const { user } = useAuthStore();
  const navItems = useNavigation();
  const addNotification = useNotifications((state) => state.addNotification);

  const { data: categories, isLoading } = useSubscriptionCategories();
  const updateCategory = useUpdateSubscriptionCategory();

  const [editingCategory, setEditingCategory] = React.useState<SubscriptionCategoryResponse | null>(null);

  const handleEdit = (category: SubscriptionCategoryResponse) => {
    setEditingCategory(category);
  };

  const handleCloseModal = () => {
    setEditingCategory(null);
  };

  const handleSubmit = (values: { monthlyPrice: number; quarterlyPrice: number }) => {
    if (!editingCategory) return;

    updateCategory.mutate({
      id: editingCategory.id,
      data: values
    }, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'Tarifs mis à jour avec succès.',
        });
        handleCloseModal();
      },
      onError: (err: any) => {
        if (!err._globallyHandled) {
          addNotification({
            type: 'error',
            text: err.response?.data?.message || 'Échec de la mise à jour des tarifs.',
          });
        }
      }
    });
  };

  if (!user) return null;

  return (
    <PrivateLayout navItems={navItems} user={user}>
      <div className="sncft-page-shell sncft-page-content-wide sncft-page-section">
        
        {/* Page Header */}
        <div className="sncft-page-header">
          <h1 className="sncft-page-title">
            Catégories d'abonnement
          </h1>
          <p className="sncft-page-subtitle">
            Configuration globale des tarifs mensuels et trimestriels.
          </p>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <RotatingLoader label="Chargement des catégories..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {categories?.map((category) => (
              <Card
                key={category.id}
                className="bg-white dark:bg-slate-900 
                          border border-slate-200 dark:border-slate-800 
                          rounded-2xl p-6 shadow-sm min-w-56"
              >
                <h3 className="sncft-heading-lg mb-6">
                  {SUBSCRIPTION_CATEGORY_LABELS[category.name] || category.name}
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mensuel</span>
                    <span className="text-lg font-black text-primary dark:text-blue-400">
                      {category.monthlyPrice.toFixed(2)} <span className="text-[10px] text-slate-500">DT</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trimestriel</span>
                    <span className="text-lg font-black text-primary dark:text-blue-400">
                      {category.quarterlyPrice.toFixed(2)} <span className="text-[10px] text-slate-500">DT</span>
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleEdit(category)}
                  className="w-full border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-primary hover:text-white hover:border-primary"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier les tarifs
                </Button>
              </Card>
            ))}
          </div>
        )}

        <EditCategoryModal
          category={editingCategory}
          isOpen={editingCategory !== null}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isLoading={updateCategory.isPending}
        />
      </div>
    </PrivateLayout>
  );
};
