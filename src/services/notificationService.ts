/**
 * Notification Service
 * Handles all in-app and system notifications for STEMM Lab
 * Supports both immediate local notifications and scheduled notifications
 */

import * as Notifications from 'expo-notifications';

// Configure notification handler for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'challenge' | 'achievement' | 'reminder' | 'info' | 'activity_complete';
  timestamp: number;
  read: boolean;
  data?: Record<string, any>;
};

/**
 * Request notification permissions from user
 * Should be called once at app startup
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    // If already granted, return true
    if (existingStatus === 'granted') {
      console.log('[notificationService] Notification permissions already granted');
      return true;
    }

    // If denied or not determined, request
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    console.log('[notificationService] Notification permission result:', granted);
    return granted;
  } catch (err) {
    console.warn('[notificationService] Failed to request notification permissions:', err);
    return false;
  }
}

/**
 * Send an immediate local notification
 * Use for activity completion, achievements, etc.
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | undefined> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
      },
      trigger: null, // null means immediate
    });
    console.log('[notificationService] Immediate notification sent:', notificationId);
    return notificationId;
  } catch (err) {
    console.warn('[notificationService] Failed to send immediate notification:', err);
    return undefined;
  }
}

/**
 * Schedule a notification to be sent after a delay (in seconds)
 * Use for reminders, timed challenges, etc.
 */
export async function scheduleNotification(
  title: string,
  body: string,
  delaySeconds: number,
  data?: Record<string, any>
): Promise<string | undefined> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });
    console.log('[notificationService] Scheduled notification set for', delaySeconds, 'seconds:', notificationId);
    return notificationId;
  } catch (err) {
    console.warn('[notificationService] Failed to schedule notification:', err);
    return undefined;
  }
}

/**
 * Send a notification for activity completion with location
 * Called when user completes an activity
 */
export async function sendActivityCompleteNotification(
  activityTitle: string,
  result: string,
  locationName?: string,
  data?: Record<string, any>
): Promise<string | undefined> {
  const locationPart = locationName ? ` at ${locationName}` : '';
  const body = `Result: ${result}${locationPart}`;

  return sendImmediateNotification(
    `🎉 ${activityTitle} Completed`,
    body,
    {
      screen: 'History',
      ...data,
    }
  );
}

/**
 * Notify that a team has completed an activity
 */
export async function notifyActivityComplete(
  teamName: string,
  activityName: string
): Promise<string | undefined> {
  return sendImmediateNotification(
    `🎉 ${activityName} Completed`,
    `${teamName} finished the activity.`,
    { screen: 'History' }
  );
}

/**
 * Notify that a team has set a new high score for an activity
 */
export async function notifyNewHighScore(
  teamName: string,
  activityName: string,
  score: number
): Promise<string | undefined> {
  return sendImmediateNotification(
    `🏆 New High Score!`,
    `${teamName} set a new record on ${activityName}: ${score}`,
    { screen: 'History' }
  );
}

/**
 * Set up notification response listener
 * Should be called once at app startup
 * Returns the listener subscription that can be used to clean up later
 */
export function setupNotificationResponseListener(
  onNotificationTapped: (data: Record<string, any>) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('[notificationService] Notification tapped:', data);
    onNotificationTapped(data);
  });
}

/**
 * Create an achievement notification
 * (for in-app notification state management)
 */
export function createAchievementNotification(
  title: string,
  message: string,
  achievement?: string
): Notification {
  return {
    id: `achievement_${Date.now()}`,
    title,
    message,
    type: 'achievement',
    timestamp: Date.now(),
    read: false,
    data: { achievement },
  };
}

/**
 * Create a reminder notification
 * (for in-app notification state management)
 */
export function createReminderNotification(
  title: string,
  message: string,
  reminderId?: string
): Notification {
  return {
    id: `reminder_${Date.now()}`,
    title,
    message,
    type: 'reminder',
    timestamp: Date.now(),
    read: false,
    data: { reminderId },
  };
}

/**
 * Create an info notification
 * (for in-app notification state management)
 */
export function createInfoNotification(
  title: string,
  message: string
): Notification {
  return {
    id: `info_${Date.now()}`,
    title,
    message,
    type: 'info',
    timestamp: Date.now(),
    read: false,
  };
}

/**
 * Create a challenge notification
 * (for in-app notification state management)
 */
export function createChallengeNotification(
  title: string,
  message: string,
  activityId?: string
): Notification {
  return {
    id: `challenge_${Date.now()}`,
    title,
    message,
    type: 'challenge',
    timestamp: Date.now(),
    read: false,
    data: { activityId },
  };
}
