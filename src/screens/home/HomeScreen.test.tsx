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
  const route = { key: 'Dashboard', name: 'Dashboard' as const, params: undefined };
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
