import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Notification } from '../services/notificationService';
import {
  createChallengeNotification,
  createAchievementNotification,
  createReminderNotification,
  createInfoNotification,
  sendLocalNotification,
} from '../services/notificationService';

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  sendChallenge: (title: string, message: string, activityId?: string) => Promise<void>;
  sendAchievement: (title: string, message: string, achievement?: string) => Promise<void>;
  sendReminder: (title: string, message: string, reminderId?: string) => Promise<void>;
  sendInfo: (title: string, message: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(async (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    await sendLocalNotification(notification);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const sendChallenge = useCallback(
    async (title: string, message: string, activityId?: string) => {
      const notification = createChallengeNotification(title, message, activityId);
      await addNotification(notification);
    },
    [addNotification]
  );

  const sendAchievement = useCallback(
    async (title: string, message: string, achievement?: string) => {
      const notification = createAchievementNotification(title, message, achievement);
      await addNotification(notification);
    },
    [addNotification]
  );

  const sendReminder = useCallback(
    async (title: string, message: string, reminderId?: string) => {
      const notification = createReminderNotification(title, message, reminderId);
      await addNotification(notification);
    },
    [addNotification]
  );

  const sendInfo = useCallback(
    async (title: string, message: string) => {
      const notification = createInfoNotification(title, message);
      await addNotification(notification);
    },
    [addNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        sendChallenge,
        sendAchievement,
        sendReminder,
        sendInfo,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
