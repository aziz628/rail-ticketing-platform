import { useEffect, type JSX } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/stores/notifications-store';

type NotificationProps = {
  notification: Notification;
  onDismiss: (id: string) => void;
};

const variantMap: Record<NotificationType, { icon: JSX.Element; className: string }> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  warning: {
    icon: <AlertCircle className="h-5 w-5" />,
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    className: 'border-slate-200 bg-white text-slate-900',
  },
};

const NOTIFICATION_AUTO_DISMISS_MS = 3000;

export const NotificationToast = ({ notification, onDismiss }: NotificationProps) => {
 
  // Dismiss the notification after 3 seconds
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(notification.id);
    }, NOTIFICATION_AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const variant = variantMap[notification.type];

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 fade-in',
        variant.className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{variant.icon}</div>
        <p className="min-w-0 flex-1 text-sm font-medium leading-5">{notification.text}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-current hover:bg-black/5"
          onClick={() => onDismiss(notification.id)}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
