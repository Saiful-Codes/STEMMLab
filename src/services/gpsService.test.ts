import * as Location from 'expo-location';
import {
  formatLocation,
  calculateDistance,
  requestLocationPermission,
  getCurrentLocation,
} from './gpsService';

const mockedLocation = Location as jest.Mocked<typeof Location>;

describe('formatLocation', () => {
  it('returns "Location not available" when either arg is missing', () => {
    expect(formatLocation(undefined, undefined)).toBe('Location not available');
    expect(formatLocation(10, undefined)).toBe('Location not available');
    expect(formatLocation(undefined, 20)).toBe('Location not available');
  });

  it('returns formatted "lat, lon" string for valid coords', () => {
    expect(formatLocation(-37.808401, 144.964432)).toBe('-37.8084, 144.9644');
    expect(formatLocation(0, 0)).toBe('0.0000, 0.0000');
  });
});

describe('calculateDistance', () => {
  it('returns 0 for identical coords', () => {
    expect(calculateDistance(-37.8, 144.9, -37.8, 144.9)).toBe(0);
  });

  it('returns ~111000 m for a 1° latitude offset (within ±1%)', () => {
    const d = calculateDistance(0, 0, 1, 0);
    expect(d).toBeGreaterThan(111000 * 0.99);
    expect(d).toBeLessThan(111000 * 1.01);
  });
});

describe('requestLocationPermission', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns true when expo-location grants permission', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted',
    } as never);
    await expect(requestLocationPermission()).resolves.toBe(true);
  });

  it('returns false when status is denied', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    } as never);
    await expect(requestLocationPermission()).resolves.toBe(false);
  });
});

describe('getCurrentLocation', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns null when permission is missing', async () => {
    mockedLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    } as never);
    await expect(getCurrentLocation()).resolves.toBeNull();
    expect(mockedLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns coords + locationName when permission granted and reverse-geocode succeeds', async () => {
    mockedLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted',
    } as never);
    mockedLocation.getCurrentPositionAsync.mockResolvedValueOnce({
      coords: {
        latitude: -37.8084,
        longitude: 144.9644,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 1700000000000,
    } as never);
    mockedLocation.reverseGeocodeAsync.mockResolvedValueOnce([
      {
        street: 'Swanston St',
        city: 'Melbourne',
        region: 'VIC',
      } as never,
    ]);

    const result = await getCurrentLocation();
    expect(result).toEqual({
      latitude: -37.8084,
      longitude: 144.9644,
      accuracy: 5,
      locationName: 'Swanston St Melbourne VIC',
    });
  });

  it('returns coords with undefined locationName when reverse-geocode throws', async () => {
    mockedLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted',
    } as never);
    mockedLocation.getCurrentPositionAsync.mockResolvedValueOnce({
      coords: {
        latitude: 12.34,
        longitude: 56.78,
        accuracy: 8,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 0,
    } as never);
    mockedLocation.reverseGeocodeAsync.mockRejectedValueOnce(
      new Error('geocode unavailable')
    );

    const result = await getCurrentLocation();
    expect(result).toEqual({
      latitude: 12.34,
      longitude: 56.78,
      accuracy: 8,
      locationName: undefined,
    });
  });
});
