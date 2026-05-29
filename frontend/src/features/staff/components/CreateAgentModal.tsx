import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAgent } from '../api/use-staff';
import { useNotifications } from '@/stores/notifications-store';
import { agentSchema, type AgentFormValues } from '../schemas';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAgentModal = ({ isOpen, onClose }: CreateAgentModalProps) => {
  const createAgent = useCreateAgent();
  const addNotification = useNotifications((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = (data: AgentFormValues) => {
    createAgent.mutate(data, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          text: 'Agent créé avec succès',
        });
        reset();
        onClose();
      },
      onError: (error: any) => {
        if (!error._globallyHandled) {
          addNotification({
            type: 'error',
            text: error.response?.data?.message || 'Erreur lors de la création',
          });
        }
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sncft-modal-medium">
        <DialogHeader>
          <DialogTitle className="sncft-modal-title">Nouveau membre de l'équipe</DialogTitle>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Création d'un Agent de Vente</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name" className="sncft-form-label">Nom complet</Label>
            <Input
              id="agent-name"
              placeholder="Ex: Ahmed Ben Salem"
              {...register('name')}
              className={errors.name ? 'border-red-500' : 'bg-slate-50 border-slate-200'}
            />
            {errors.name && (
              <p className="sncft-form-error">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-email" className="sncft-form-label">Adresse e-mail</Label>
            <Input
              id="agent-email"
              type="email"
              placeholder="ahmed.salem@sncft.tn"
              {...register('email')}
              className={errors.email ? 'border-red-500' : 'bg-slate-50 border-slate-200'}
            />
            {errors.email && (
              <p className="sncft-form-error">{errors.email.message}</p>
            )}
          </div>
          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createAgent.isPending}
              className="flex-1 font-bold text-slate-500"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createAgent.isPending}
              className="flex-1 primary-sncft font-bold"
            >
              {createAgent.isPending ? 'Création...' : 'Créer l\'agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
