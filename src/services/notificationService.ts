/**
 * Notification Service
 * Handles all in-app and system notifications for STEMM Lab
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'challenge' | 'achievement' | 'reminder' | 'info';
  timestamp: number;
  read: boolean;
  data?: Record<string, any>;
};

const NOTIFICATIONS_KEY = 'notifications';

/**
 * Store notification locally
 */
export async function saveNotification(notification: Notification): Promise<void> {
  try {
    // This would be expanded to use your actual storage system
    // For now, just log it
    console.log('[notificationService] Notification saved:', notification);
  } catch (err) {
    console.warn('[notificationService] Failed to save notification:', err);
  }
}

/**
 * Create a challenge notification (e.g., timed challenge reminder)
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

/**
 * Create an achievement notification (e.g., new high score, milestone)
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
 * Create a reminder notification (e.g., activity reminder)
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
 * Create an info notification (e.g., general updates)
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
 * Send a timed challenge (background task)
 * Call this to schedule a challenge to be sent after a delay
 */
export async function scheduleTimedChallenge(
  delayMs: number,
  title: string,
  message: string,
  activityId?: string
): Promise<void> {
  try {
    // Schedule a background task
    const taskName = `challenge_${Date.now()}`;

    await TaskManager.defineTask(taskName, async () => {
      const notification = createChallengeNotification(title, message, activityId);
      await saveNotification(notification);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    });

    await BackgroundFetch.registerTaskAsync(taskName, {
      minimumInterval: delayMs / 1000, // Convert to seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[notificationService] Timed challenge scheduled:', taskName);
  } catch (err) {
    console.warn('[notificationService] Failed to schedule timed challenge:', err);
  }
}

/**
 * Send a local notification alert
 * In a real app, this would integrate with native notification libraries
 * For now, just emit/save the notification
 */
export async function sendLocalNotification(notification: Notification): Promise<void> {
  try {
    // TODO: Integrate with native notification APIs if needed
    // For now, just save it to app state/storage
    await saveNotification(notification);
  } catch (err) {
    console.warn('[notificationService] Failed to send local notification:', err);
  }
}

/**
 * Send achievement notification for completing an activity
 */
export async function notifyActivityComplete(
  teamName: string,
  activityName: string
): Promise<void> {
  const notification = createAchievementNotification(
    'Activity Completed! 🎉',
    `${teamName} has completed ${activityName}. Great work!`,
    activityName
  );
  await sendLocalNotification(notification);
}

/**
 * Send notification for new high score
 */
export async function notifyNewHighScore(
  teamName: string,
  activityName: string,
  score: number | string
): Promise<void> {
  const notification = createAchievementNotification(
    'New High Score! 🏆',
    `${teamName} achieved a new high score in ${activityName}: ${score}`,
    `${activityName}_score`
  );
  await sendLocalNotification(notification);
}

/**
 * Send challenge reminder
 */
export async function notifyChallengeReminder(
  challengeName: string,
  timeRemaining: string
): Promise<void> {
  const notification = createReminderNotification(
    'Challenge Reminder ⏰',
    `${challengeName} - ${timeRemaining} remaining`,
    challengeName
  );
  await sendLocalNotification(notification);
}

/**
 * Send team invitation notification
 */
export async function notifyTeamEvent(
  eventType: 'member_joined' | 'new_activity' | 'leaderboard_update',
  message: string
): Promise<void> {
  let title = '';
  switch (eventType) {
    case 'member_joined':
      title = 'Team Member Joined 👋';
      break;
    case 'new_activity':
      title = 'New Activity Available 📋';
      break;
    case 'leaderboard_update':
      title = 'Leaderboard Updated 📊';
      break;
  }

  const notification = createInfoNotification(title, message);
  await sendLocalNotification(notification);
}
