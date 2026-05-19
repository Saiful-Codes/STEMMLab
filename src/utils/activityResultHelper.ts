/**
 * Activity Result Helper
 * Utilities for saving activity results with GPS location tagging
 */

import { Result } from '../types/Result';
import { LocationData } from '../services/gpsService';
import { saveResult as saveResultToStorage } from '../storage/results';
import {
  notifyActivityComplete,
  notifyNewHighScore,
} from '../services/notificationService';

/**
 * Save an activity result with GPS location data
 * This function combines result data with location information
 */
export async function saveActivityResultWithLocation(
  result: Result,
  location: LocationData | null
): Promise<Result> {
  const resultWithLocation: Result = {
    ...result,
    latitude: location?.latitude,
    longitude: location?.longitude,
    accuracy: location?.accuracy,
    locationName: location?.locationName,
  };

  try {
    await saveResultToStorage(resultWithLocation);
    return resultWithLocation;
  } catch (err) {
    console.warn('[activityResultHelper] Failed to save result:', err);
    throw err;
  }
}

/**
 * Save activity result and send completion notification
 */
export async function saveAndNotifyActivityComplete(
  result: Result,
  location: LocationData | null,
  activityName: string
): Promise<Result> {
  try {
    const savedResult = await saveActivityResultWithLocation(result, location);

    // Send completion notification
    await notifyActivityComplete(result.teamName, activityName);

    return savedResult;
  } catch (err) {
    console.warn('[activityResultHelper] Failed to save and notify:', err);
    throw err;
  }
}

/**
 * Check if result is a new high score and notify if so
 * Compares current result against previous results for the same activity
 */
export async function checkAndNotifyHighScore(
  result: Result,
  previousResults: Result[],
  activityName: string
): Promise<boolean> {
  try {
    const sameActivityResults = previousResults.filter(
      (r) => r.activityId === result.activityId
    );

    if (sameActivityResults.length === 0) {
      // First result for this activity, no comparison needed
      return false;
    }

    // For numeric results, check if it's higher than previous max
    if (typeof result.result === 'number') {
      const previousMax = Math.max(
        ...sameActivityResults
          .map((r) => (typeof r.result === 'number' ? r.result : 0))
          .filter((r) => !isNaN(r))
      );

      if (result.result > previousMax) {
        await notifyNewHighScore(result.teamName, activityName, result.result);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.warn('[activityResultHelper] Failed to check high score:', err);
    return false;
  }
}

/**
 * Format result data for display including location
 */
export function formatResultForDisplay(result: Result): {
  result: string;
  location?: string;
  timestamp: string;
} {
  const timestamp = new Date(result.timestamp).toLocaleString();
  const location = result.latitude && result.longitude
    ? `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`
    : result.locationName
      ? result.locationName
      : undefined;

  return {
    result: String(result.result),
    location,
    timestamp,
  };
}

/**
 * Batch save multiple results with GPS locations
 */
export async function saveBatchResultsWithLocation(
  results: Result[],
  locations: (LocationData | null)[]
): Promise<Result[]> {
  try {
    const savedResults = await Promise.all(
      results.map((result, index) =>
        saveActivityResultWithLocation(result, locations[index] || null)
      )
    );
    return savedResults;
  } catch (err) {
    console.warn('[activityResultHelper] Failed to save batch results:', err);
    throw err;
  }
}
