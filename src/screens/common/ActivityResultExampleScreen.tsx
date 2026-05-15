/**
 * Example: Activity Result Screen with GPS and Notifications
 * This is a reference implementation showing how to integrate GPS location tagging
 * and notifications into an activity result screen.
 *
 * Copy and adapt this component for your specific activities.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocation } from '../../context/LocationContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTeam } from '../../context/TeamContext';
import {
  saveActivityResultWithLocation,
  checkAndNotifyHighScore,
} from '../../utils/activityResultHelper';
import { getResults } from '../../storage/results';
import { Result } from '../../types/Result';

interface ActivityResultExampleScreenProps {
  activityId: string;
  activityName: string;
  resultValue: number | string;
  additionalData?: Record<string, any>;
}

export function ActivityResultExampleScreen({
  activityId,
  activityName,
  resultValue,
  additionalData,
}: ActivityResultExampleScreenProps) {
  const { team } = useTeam();
  const { location, loading: locationLoading, error: locationError, refreshLocation } = useLocation();
  const { sendAchievement, sendInfo } = useNotifications();

  const [saving, setSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<Result | null>(null);
  const [isHighScore, setIsHighScore] = useState(false);

  // Get location when component mounts
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const handleSaveResult = async () => {
    if (!team) {
      Alert.alert('Error', 'No team information available');
      return;
    }

    try {
      setSaving(true);

      // Create the result object
      const result: Result = {
        id: `result_${Date.now()}`,
        activityId,
        teamName: team.name,
        members: team.members,
        result: resultValue,
        timestamp: Date.now(),
        ...additionalData, // Include rating, comment, etc. if provided
      };

      // Save result with GPS location
      const savedResultData = await saveActivityResultWithLocation(result, location);
      setSavedResult(savedResultData);

      // Check for high score
      const previousResults = await getResults();
      const isNewHighScore = await checkAndNotifyHighScore(
        savedResultData,
        previousResults,
        activityName
      );
      setIsHighScore(isNewHighScore);

      // Send completion notification
      await sendAchievement(
        'Activity Completed! 🎉',
        `${team.name} completed ${activityName}${
          location?.locationName ? ` at ${location.locationName}` : ''
        }`
      );

      Alert.alert('Success', 'Activity result saved with GPS location!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', `Failed to save result: ${errorMessage}`);
      console.error('Failed to save result:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestLocationPermission = async () => {
    await refreshLocation();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{activityName} - Result Summary</Text>

      {/* Result Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Result</Text>
        <View style={styles.card}>
          <Text style={styles.resultValue}>{resultValue}</Text>
          <Text style={styles.resultLabel}>Result recorded</Text>
        </View>
      </View>

      {/* GPS Location Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GPS Location</Text>
        <View style={styles.card}>
          {locationLoading ? (
            <>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Getting location...</Text>
            </>
          ) : locationError ? (
            <>
              <Text style={styles.errorText}>Error: {locationError}</Text>
              <Button
                title="Retry Permission"
                onPress={handleRequestLocationPermission}
              />
            </>
          ) : location ? (
            <>
              <Text style={styles.locationCoords}>
                📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
              {location.locationName && (
                <Text style={styles.locationName}>{location.locationName}</Text>
              )}
              <Text style={styles.accuracy}>
                Accuracy: ±{location.accuracy?.toFixed(0) || 'Unknown'}m
              </Text>
            </>
          ) : (
            <Text style={styles.errorText}>Location not available</Text>
          )}
        </View>
      </View>

      {/* Team Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Information</Text>
        <View style={styles.card}>
          <Text style={styles.teamName}>{team?.name || 'Unknown Team'}</Text>
          <Text style={styles.memberCount}>
            Members: {team?.members.length || 0}
          </Text>
          {team?.members.map((member: string, index: number) => (
            <Text key={index} style={styles.memberName}>
              • {member}
            </Text>
          ))}
        </View>
      </View>

      {/* High Score Indicator */}
      {isHighScore && (
        <View style={[styles.section, styles.highScoreSection]}>
          <Text style={styles.highScoreText}>🏆 NEW HIGH SCORE! 🏆</Text>
        </View>
      )}

      {/* Saved Result Summary */}
      {savedResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Result</Text>
          <View style={styles.card}>
            <Text>✓ Result ID: {savedResult.id.substring(0, 8)}...</Text>
            <Text>✓ Result: {savedResult.result}</Text>
            {savedResult.latitude && (
              <Text>✓ Location: {savedResult.latitude.toFixed(4)}, {savedResult.longitude?.toFixed(4)}</Text>
            )}
            <Text>✓ Team: {savedResult.teamName}</Text>
            <Text>
              ✓ Saved: {new Date(savedResult.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title={saving ? 'Saving...' : 'Save Result with Location'}
          onPress={handleSaveResult}
          disabled={saving || !team}
          color="#007AFF"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Refresh Location"
          onPress={handleRequestLocationPermission}
          color="#666"
        />
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How This Works</Text>
        <Text style={styles.instructionText}>
          1. This screen automatically requests GPS location permission{'\n'}
          2. Your device's current coordinates are captured{'\n'}
          3. When you click "Save Result", the activity result is saved along with
          the GPS coordinates{'\n'}
          4. The system checks if this is a new high score and notifies you{'\n'}
          5. A notification is sent to confirm the activity completion
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  locationCoords: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  accuracy: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  highScoreSection: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#ffd54f',
  },
  highScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f57f17',
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default ActivityResultExampleScreen;
