/**
 * App.tsx smoke render — proves the full provider tree + RootNavigator mount
 * without throwing. We do NOT exercise navigation, screens, or side effects
 * beyond what mounting requires.
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';

// Side-effect-heavy modules mocked at the very top, before App is imported.

// initDatabase resolves cleanly so the useEffect in App doesn't surface an error.
jest.mock('./src/storage/sqliteDb', () => ({
  initDatabase: jest.fn(async () => undefined),
}));

// backgroundTaskService is imported purely for its `defineTask` side-effect.
// Replace the whole module with an empty object so no real task is registered.
jest.mock('./src/services/backgroundTaskService', () => ({}));

// notificationService — the App calls these from a startup useEffect.
// Make both succeed and return a removable subscription.
jest.mock('./src/services/notificationService', () => ({
  requestNotificationPermissions: jest.fn(async () => true),
  setupNotificationResponseListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// expo-notifications is already globally mocked in jest.setup.ts; the existing
// mock returns `{ status: 'granted' }` from requestPermissionsAsync and a
// removable subscription from addNotificationResponseReceivedListener.

// firebase/auth ships an ESM postinstall file Jest cannot parse — stub the
// surface authService imports. The full authService surface is unit-tested
// separately in src/services/authService.test.ts.
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => undefined),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => ({ docs: [] })),
  query: jest.fn(),
  where: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(() => '__server_ts__'),
}));
jest.mock('./src/services/firebase', () => ({
  auth: { __mock: 'auth' },
  db: { __mock: 'db' },
}));

// react-native-gifted-charts ships ESM that Jest cannot parse. Replace BarChart
// (used by PerformanceChart inside HistoryScreen) with a passthrough View so
// the full nav graph can load.
jest.mock('react-native-gifted-charts', () => {
  const ReactInner = require('react');
  const { View } = require('react-native');
  return {
    BarChart: (props: { children?: React.ReactNode }) =>
      ReactInner.createElement(View, { testID: 'mock-bar-chart' }, props.children),
  };
});

import App from './App';

describe('App smoke render', () => {
  it('mounts the full provider tree + RootNavigator without throwing', async () => {
    const tree = render(<App />);

    // Flush any pending startup effects (initDatabase / requestNotificationPermissions
    // promises) so React's act-warning machinery stays quiet.
    await act(async () => {
      await Promise.resolve();
    });

    expect(tree.toJSON()).not.toBeNull();
    tree.unmount();
  });
});
