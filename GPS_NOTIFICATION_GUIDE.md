# GPS and Notification Integration Guide

This guide explains how to use the GPS location tagging and notification systems in STEMM Lab.

## Overview

The STEMM Lab app now includes:
- **GPS Location Tagging**: Automatically captures device location when activities are completed
- **Notification System**: Sends notifications for challenges, achievements, and reminders

## GPS Integration

### Basic Usage

#### 1. Get Current Location in a Screen Component

```typescript
import { useLocation } from '../context/LocationContext';
import { useEffect, useState } from 'react';

export function MyActivityScreen() {
  const { location, loading, error, refreshLocation, permissionGranted } = useLocation();

  useEffect(() => {
    // Request permission and get location when screen loads
    if (!permissionGranted) {
      refreshLocation();
    }
  }, []);

  const handleActivityComplete = async () => {
    // Get fresh location
    await refreshLocation();
    
    if (location) {
      // Use location data for your activity result
      console.log('Location:', location.latitude, location.longitude);
    }
  };

  return (
    <View>
      <Text>
        {location ? `Located at: ${location.latitude}, ${location.longitude}` : 'Getting location...'}
      </Text>
    </View>
  );
}
```

#### 2. Save Activity Result with GPS Data

```typescript
import { saveActivityResultWithLocation } from '../utils/activityResultHelper';
import { useLocation } from '../context/LocationContext';

export function ActivityResultScreen() {
  const { location } = useLocation();
  
  const handleSaveResult = async () => {
    const result: Result = {
      id: generateId(),
      activityId: 'parachute',
      teamName: 'Team A',
      members: ['Student 1', 'Student 2'],
      result: 2.5, // fall time in seconds
      timestamp: Date.now(),
    };

    try {
      const savedResult = await saveActivityResultWithLocation(result, location);
      console.log('Result saved with location:', savedResult);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
  };

  return (
    <Button title="Save Result" onPress={handleSaveResult} />
  );
}
```

#### 3. Displaying Location Information

```typescript
import { formatLocation } from '../services/gpsService';

export function ResultDetailsScreen({ result }: { result: Result }) {
  return (
    <View>
      <Text>Activity Result: {result.result}</Text>
      <Text>Location: {formatLocation(result.latitude, result.longitude)}</Text>
      {result.locationName && (
        <Text>Address: {result.locationName}</Text>
      )}
      <Text>Accuracy: ±{result.accuracy?.toFixed(0)}m</Text>
    </View>
  );
}
```

#### 4. Calculate Distance Between Results

```typescript
import { calculateDistance } from '../services/gpsService';

function compareLocationResults(result1: Result, result2: Result) {
  if (!result1.latitude || !result2.latitude) {
    return null;
  }

  const distance = calculateDistance(
    result1.latitude,
    result1.longitude,
    result2.latitude,
    result2.longitude
  );

  return {
    distanceInMeters: distance,
    distanceInKm: (distance / 1000).toFixed(2),
  };
}
```

## Notification Integration

### Basic Usage

#### 1. Send Challenge Notification

```typescript
import { useNotifications } from '../context/NotificationContext';

export function ChallengeScreen() {
  const { sendChallenge } = useNotifications();

  const handleStartChallenge = async () => {
    await sendChallenge(
      'Reaction Speed Challenge! ⚡',
      'Tap the screen as fast as you can!',
      'reaction-board'
    );
  };

  return (
    <Button title="Start Challenge" onPress={handleStartChallenge} />
  );
}
```

#### 2. Send Achievement Notification

```typescript
import { useNotifications } from '../context/NotificationContext';

export function ActivityCompleteScreen() {
  const { sendAchievement } = useNotifications();

  useEffect(() => {
    // Notify when activity is completed
    sendAchievement(
      'Activity Complete! 🎉',
      `Team completed the Parachute Drop Challenge successfully!`,
      'parachute-complete'
    );
  }, []);

  return <View>{/* ... */}</View>;
}
```

#### 3. Send Reminder Notifications

```typescript
import { useNotifications } from '../context/NotificationContext';

export function TimerScreen() {
  const { sendReminder } = useNotifications();

  const handleTimeWarning = async () => {
    if (timeRemaining === 60) {
      await sendReminder(
        '1 Minute Remaining ⏰',
        'You have 1 minute left to complete the challenge!',
        'challenge-timer'
      );
    }
  };

  return <View>{/* ... */}</View>;
}
```

#### 4. Display Notifications to User

```typescript
import { useNotifications } from '../context/NotificationContext';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';

export function NotificationCenterScreen() {
  const { notifications, unreadCount, markAsRead, removeNotification } = useNotifications();

  return (
    <View>
      <Text>Notifications ({unreadCount} unread)</Text>
      <ScrollView>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            onPress={() => markAsRead(notification.id)}
            style={{
              backgroundColor: notification.read ? '#f0f0f0' : '#e3f2fd',
              padding: 12,
              marginBottom: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: 'bold' }}>{notification.title}</Text>
            <Text>{notification.message}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {new Date(notification.timestamp).toLocaleString()}
            </Text>
            <TouchableOpacity
              onPress={() => removeNotification(notification.id)}
            >
              <Text>Dismiss</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
```

## Combined GPS + Notification Example

Here's a complete example of an activity screen that uses both GPS and notifications:

```typescript
import { useLocation } from '../context/LocationContext';
import { useNotifications } from '../context/NotificationContext';
import { saveAndNotifyActivityComplete } from '../utils/activityResultHelper';
import { Result } from '../types/Result';

export function ParachuteActivityScreen() {
  const { location, refreshLocation } = useLocation();
  const { sendAchievement } = useNotifications();
  const [result, setResult] = useState<number | null>(null);

  const handleActivityComplete = async (fallTime: number) => {
    // Ensure we have current location
    await refreshLocation();

    // Create result object
    const activityResult: Result = {
      id: `result_${Date.now()}`,
      activityId: 'parachute-drop',
      teamName: 'Team A',
      members: ['Student 1', 'Student 2'],
      result: fallTime,
      timestamp: Date.now(),
    };

    try {
      // Save result with location and send notification
      const savedResult = await saveAndNotifyActivityComplete(
        activityResult,
        location,
        'Parachute Drop Challenge'
      );

      console.log('Result saved:', savedResult);
      
      // Additional notification
      await sendAchievement(
        'Great Job! 🚀',
        `Your parachute fall time: ${fallTime.toFixed(2)}s at ${location?.locationName || 'current location'}`
      );
    } catch (err) {
      console.error('Failed to save activity:', err);
    }
  };

  return (
    <View>
      {location && (
        <Text>Current Location: {location.latitude}, {location.longitude}</Text>
      )}
      {/* Activity UI */}
      <Button 
        title="Complete Activity" 
        onPress={() => handleActivityComplete(2.5)} 
      />
    </View>
  );
}
```

## API Reference

### GPS Service (`gpsService.ts`)

- `requestLocationPermission()` - Request access to device location
- `checkLocationPermission()` - Check if permission is already granted
- `getCurrentLocation()` - Get current GPS coordinates
- `formatLocation(lat, lon)` - Format coordinates for display
- `calculateDistance(lat1, lon1, lat2, lon2)` - Calculate distance between two points

### Location Context (`LocationContext.tsx`)

- `useLocation()` hook provides:
  - `location` - Current location data
  - `loading` - Loading state
  - `error` - Error message if any
  - `permissionGranted` - Permission status
  - `refreshLocation()` - Update current location
  - `requestPermission()` - Request location permission

### Notification Service (`notificationService.ts`)

- `sendLocalNotification(notification)` - Send a notification
- `notifyActivityComplete(teamName, activityName)` - Activity completion
- `notifyNewHighScore(teamName, activityName, score)` - High score achieved
- `notifyChallengeReminder(challengeName, timeRemaining)` - Challenge reminder
- `notifyTeamEvent(eventType, message)` - Team events

### Notification Context (`NotificationContext.tsx`)

- `useNotifications()` hook provides:
  - `notifications` - Array of all notifications
  - `unreadCount` - Number of unread notifications
  - `addNotification(notification)` - Add new notification
  - `markAsRead(id)` - Mark notification as read
  - `markAllAsRead()` - Mark all as read
  - `removeNotification(id)` - Delete notification
  - `sendChallenge()` - Send challenge notification
  - `sendAchievement()` - Send achievement notification
  - `sendReminder()` - Send reminder notification
  - `sendInfo()` - Send info notification

## Best Practices

1. **Always check permission before accessing location** - GPS requires user permission
2. **Handle location errors gracefully** - Location may be unavailable in some environments
3. **Cache location data** - Don't request location too frequently to save battery
4. **Test on real devices** - Simulator may not provide accurate GPS data
5. **Use notifications sparingly** - Too many notifications can annoy users
6. **Display location accuracy** - Show users the GPS accuracy (±Xm)

## Troubleshooting

### Location not available
- Check that location permission is granted in system settings
- Ensure the device has GPS enabled
- Try requesting permission again with `refreshLocation()`

### Notifications not showing
- Check that notifications are enabled for the app
- Ensure NotificationProvider wraps your component tree
- Check browser console for errors

### High battery drain
- Reduce frequency of location requests
- Use lower accuracy settings if high precision isn't needed
- Consider caching location data for short periods

## Testing

To test GPS and notifications:

```typescript
// Test GPS
const { refreshLocation, location } = useLocation();
await refreshLocation();
console.log('Location:', location);

// Test Notifications
const { sendAchievement, notifications } = useNotifications();
await sendAchievement('Test', 'This is a test notification');
console.log('Notifications:', notifications);
```
