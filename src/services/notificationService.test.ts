import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  setupNotificationResponseListener,
} from './notificationService';

const mockedGetPermissions = Notifications.getPermissionsAsync as jest.MockedFunction<
  typeof Notifications.getPermissionsAsync
>;
const mockedRequestPermissions = Notifications.requestPermissionsAsync as jest.MockedFunction<
  typeof Notifications.requestPermissionsAsync
>;
const mockedAddResponseListener =
  Notifications.addNotificationResponseReceivedListener as jest.MockedFunction<
    typeof Notifications.addNotificationResponseReceivedListener
  >;

describe('requestNotificationPermissions', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('resolves to true when permission is already granted and does not re-prompt', async () => {
    mockedGetPermissions.mockResolvedValueOnce({ status: 'granted', granted: true } as never);

    const result = await requestNotificationPermissions();

    expect(result).toBe(true);
    expect(mockedGetPermissions).toHaveBeenCalledTimes(1);
    expect(mockedRequestPermissions).not.toHaveBeenCalled();
  });

  it('requests permission and resolves to true when the user grants it', async () => {
    mockedGetPermissions.mockResolvedValueOnce({ status: 'undetermined', granted: false } as never);
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'granted', granted: true } as never);

    const result = await requestNotificationPermissions();

    expect(result).toBe(true);
    expect(mockedRequestPermissions).toHaveBeenCalledTimes(1);
  });

  it('requests permission and resolves to false when the user denies it', async () => {
    mockedGetPermissions.mockResolvedValueOnce({ status: 'undetermined', granted: false } as never);
    mockedRequestPermissions.mockResolvedValueOnce({ status: 'denied', granted: false } as never);

    const result = await requestNotificationPermissions();

    expect(result).toBe(false);
    expect(mockedRequestPermissions).toHaveBeenCalledTimes(1);
  });

  it('resolves to false if the permissions API throws', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockedGetPermissions.mockRejectedValueOnce(new Error('native bridge unavailable'));

    const result = await requestNotificationPermissions();

    expect(result).toBe(false);
    warnSpy.mockRestore();
  });
});

describe('setupNotificationResponseListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a response listener and returns a subscription with a remove() function', () => {
    const removeFn = jest.fn();
    mockedAddResponseListener.mockReturnValueOnce({ remove: removeFn } as never);

    const subscription = setupNotificationResponseListener(() => undefined);

    expect(mockedAddResponseListener).toHaveBeenCalledTimes(1);
    expect(typeof subscription.remove).toBe('function');

    subscription.remove();
    expect(removeFn).toHaveBeenCalledTimes(1);
  });

  it('invokes the supplied callback with the tapped notification data', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    let capturedHandler: ((response: unknown) => void) | undefined;
    mockedAddResponseListener.mockImplementationOnce(((
      handler: (response: unknown) => void
    ) => {
      capturedHandler = handler;
      return { remove: jest.fn() };
    }) as never);

    const onTapped = jest.fn();
    setupNotificationResponseListener(onTapped);

    expect(capturedHandler).toBeDefined();
    capturedHandler!({
      notification: {
        request: {
          content: {
            data: { screen: 'History', id: 'abc' },
          },
        },
      },
    });

    expect(onTapped).toHaveBeenCalledWith({ screen: 'History', id: 'abc' });
    logSpy.mockRestore();
  });
});
