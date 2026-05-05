import { create } from 'zustand';

export type NotificationType = 'info' | 'success' | 'error' | 'warning';

export type Notification = {
  id: string;
  type: NotificationType;
  text: string;
};

type NotificationsState = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
};

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = crypto.randomUUID();
    set({
      notifications: [...get().notifications, { id, ...notification }],
    });
    return id;
  },
  dismissNotification: (id) => {
    set({ notifications: get().notifications.filter((item) => item.id !== id) });
  },
  clearNotifications: () => set({ notifications: [] }),
}));
