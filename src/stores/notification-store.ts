import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: "order" | "payment" | "account" | "system";
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  items: AppNotification[];
  unread: number;
  setItems: (items: AppNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

/**
 * In-app notification center store. Seeded client-side; in production wire to
 * a notifications endpoint / websocket. Mirrors the backend Notification model
 * (kinds: order_status, payment, account, system).
 */
export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unread: 0,
  setItems: (items) =>
    set({ items, unread: items.filter((i) => !i.read).length }),
  markRead: (id) =>
    set((s) => {
      const items = s.items.map((i) =>
        i.id === id ? { ...i, read: true } : i,
      );
      return { items, unread: items.filter((i) => !i.read).length };
    }),
  markAllRead: () =>
    set((s) => ({
      items: s.items.map((i) => ({ ...i, read: true })),
      unread: 0,
    })),
}));
