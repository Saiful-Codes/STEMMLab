import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { LocationData, getCurrentLocation, checkLocationPermission, requestLocationPermission } from '../services/gpsService';

type LocationContextValue = {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  refreshLocation: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check permission on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hasPermission = await checkLocationPermission();
        if (!cancelled) {
          setPermissionGranted(hasPermission);
        }
      } catch (err) {
        console.warn('[LocationContext] Failed to check permission:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const granted = await requestLocationPermission();
      setPermissionGranted(granted);
      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request location permission';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request permission if not already granted
      if (!permissionGranted) {
        const granted = await requestPermission();
        if (!granted) {
          setError('Location permission denied');
          return;
        }
      }

      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      } else {
        setError('Failed to get current location');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [permissionGranted, requestPermission]);

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        permissionGranted,
        refreshLocation,
        requestPermission,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
