import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useFocusEffect: (callback: () => void | (() => void)) => {
      const ReactInner = require('react');
      ReactInner.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, []);
    },
  };
});

jest.mock('../../storage/results', () => ({
  getResults: jest.fn(async () => []),
}));

// TeamContext now reaches authService → firebase/auth, which ships an ESM
// postinstall file Jest cannot parse. Stub the firebase surface here, mirroring
// App.test.tsx. The auth/firestore services are unit-tested separately.
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
jest.mock('../../services/firebase', () => ({
  auth: { __mock: 'auth' },
  db: { __mock: 'db' },
}));

import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { TeamProvider } from '../../context/TeamContext';
import HomeScreen from './HomeScreen';

function makeNavigationStub() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => () => undefined),
    removeListener: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
  };
}

function renderHomeScreen() {
  const navigation = makeNavigationStub();
  const route = { key: 'Home', name: 'Home' as const, params: undefined };
  const utils = render(
    <ThemeProvider>
      <LanguageProvider>
        <TeamProvider>
          {/* @ts-expect-error — structural navigation stub for tests */}
          <HomeScreen navigation={navigation} route={route} />
        </TeamProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
  return { ...utils, navigation };
}

describe('HomeScreen', () => {
  it('renders the four Quick Access tile labels without crashing', async () => {
    const { findByText, getByText } = renderHomeScreen();

    // Quick Access section title.
    expect(await findByText('Quick Access')).toBeTruthy();

    // The four navigation tiles.
    expect(getByText('Activities')).toBeTruthy();
    expect(getByText('Leaderboard')).toBeTruthy();
    expect(getByText('History')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('renders the team banner — falls back to "Your Team" when no team is stored', async () => {
    const { findByText } = renderHomeScreen();
    expect(await findByText('Your Team')).toBeTruthy();
  });

  it('renders the welcome and footer hint text', async () => {
    const { findByText, getByText } = renderHomeScreen();
    expect(await findByText('Welcome back,')).toBeTruthy();
    await waitFor(() => {
      expect(getByText('Tap any card to explore')).toBeTruthy();
    });
  });
});
