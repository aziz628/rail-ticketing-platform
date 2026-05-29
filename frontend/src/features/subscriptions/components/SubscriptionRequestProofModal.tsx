import { CheckCircle2, FileText, Loader2, XCircle, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { StaffSubscriptionRequestResponse } from '../types/subscriptions';
import { RotatingLoader } from '@/components/ui/rotating-loader';

const renderPreviewContent = (blob?: Blob, url?: string | null, isLoading?: boolean, isError?: boolean) => {
  const panelClassName = 'flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/90 dark:border-slate-800';

  if (isLoading) {
    return (
      <div className={`${panelClassName} items-center justify-center p-6`}>
        <RotatingLoader label="Chargement de la preuve..." />
      </div>
    );
  }

  if (isError || !blob || !url) {
    return (
      <div className={`${panelClassName} flex-col items-center justify-center gap-3 p-6 text-center`}>
        <FileText className="h-10 w-10 text-slate-400" />
        <p className="text-sm font-semibold text-slate-100">Impossible de charger le document justificatif.</p>
        <p className="text-xs text-slate-400">Le fichier peut être manquant ou inaccessible.</p>
      </div>
    );
  }

  if (blob.type === 'application/pdf') {
    return (
      <iframe
        title="Aperçu du justificatif PDF"
        src={url}
        className="h-full w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800"
      />
    );
  }

  if (blob.type.startsWith('image/')) {
    return (
      <div className={`${panelClassName} items-center justify-center overflow-auto p-4`}>
        <img
          src={url}
          alt="Aperçu du justificatif"
          className="max-h-full max-w-full rounded-xl object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`${panelClassName} flex-col items-center justify-center gap-3 p-6 text-center`}>
      <FileText className="h-10 w-10 text-slate-400" />
      <p className="text-sm font-semibold text-slate-100">Aperçu indisponible pour ce format.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-bold uppercase tracking-widest text-primary"
      >
        Ouvrir le fichier
      </a>
    </div>
  );
};

interface SubscriptionRequestProofModalProps {
  request: StaffSubscriptionRequestResponse | null;
  proofBlob?: Blob;
  proofUrl: string | null;
  isLoading: boolean;
  isError: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onClose: () => void;
  onReject: () => void;
  onApprove: () => void;
}

export function SubscriptionRequestProofModal({
  request,
  proofBlob,
  proofUrl,
  isLoading,
  isError,
  isApproving,
  isRejecting,
  onClose,
  onReject,
  onApprove,
}: SubscriptionRequestProofModalProps) {
  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden p-0 sm:max-w-none">
        {request && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
              <DialogHeader className="relative pr-10">
                <DialogTitle className="sncft-modal-title">
                  Vérifier le justificatif
                </DialogTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute right-0 top-0 h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Fermer</span>
                </Button>
              </DialogHeader>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
              <div className="flex min-h-0 flex-1">
                {renderPreviewContent(proofBlob, proofUrl, isLoading, isError)}
              </div>
            </div>

            <DialogFooter className="shrink-0 flex flex-row items-center justify-center gap-3 border-t border-slate-200 p-4 dark:border-slate-800 sm:justify-center">
              <Button
                type="button"
                variant="danger"
                onClick={onReject}
                disabled={isApproving || isRejecting}
                className="w-auto min-w-32"
              >
                {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Rejeter
              </Button>
              <Button
                type="button"
                variant="primary-sncft"
                onClick={onApprove}
                disabled={isApproving || isRejecting}
                className="w-auto min-w-32"
              >
                {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approuver
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
