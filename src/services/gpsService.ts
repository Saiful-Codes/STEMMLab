import * as Location from 'expo-location';

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationName?: string;
};

/**
 * Request permission to access device location
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[gpsService] requestLocationPermission failed:', err);
    return false;
  }
}

/**
 * Check if location permission is already granted
 */
export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[gpsService] checkLocationPermission failed:', err);
    return false;
  }
}

/**
 * Get current device location
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    // Check permission first
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      console.warn('[gpsService] Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    if (!location) {
      return null;
    }

    const { latitude, longitude, accuracy } = location.coords;

    // Try to get human-readable address
    let locationName: string | undefined;
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (address && address.length > 0) {
        const addr = address[0];
        locationName =
          `${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim() ||
          undefined;
      }
    } catch (err) {
      // Reverse geocoding failed, but we still have coordinates
      console.warn('[gpsService] Reverse geocoding failed:', err);
    }

    return {
      latitude,
      longitude,
      accuracy: accuracy ?? undefined,
      locationName,
    };
  } catch (err) {
    console.warn('[gpsService] getCurrentLocation failed:', err);
    return null;
  }
}

/**
 * Format location for display
 */
export function formatLocation(latitude?: number, longitude?: number): string {
  if (!latitude || !longitude) {
    return 'Location not available';
  }
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/**
 * Calculate distance between two GPS points (in meters) using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
