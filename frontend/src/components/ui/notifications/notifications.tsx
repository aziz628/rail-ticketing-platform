import { NotificationToast } from './notification';
import { useNotifications } from '@/stores/notifications-store';

export const Notifications = () => {
  const notifications = useNotifications((state) => state.notifications);
  const dismissNotification = useNotifications((state) => state.dismissNotification);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed right-4 top-4 z-[55] flex w-full max-w-md flex-col gap-3 sm:right-6 sm:top-6"
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
};
