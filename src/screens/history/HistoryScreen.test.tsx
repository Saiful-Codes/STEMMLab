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

// react-native-gifted-charts pulls in native dependencies that aren't worth
// wiring up for a screen-level test; stub it to a passthrough component.
jest.mock('react-native-gifted-charts', () => {
  const ReactInner = require('react');
  const { View } = require('react-native');
  return {
    BarChart: (props: { children?: React.ReactNode }) =>
      ReactInner.createElement(View, { testID: 'mock-bar-chart' }, props.children),
  };
});

jest.mock('../../storage/results', () => ({
  getResults: jest.fn(),
}));

import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import HistoryScreen from './HistoryScreen';
import { getResults } from '../../storage/results';
import { Result } from '../../types/Result';

const mockedGetResults = getResults as jest.MockedFunction<typeof getResults>;

function renderHistoryScreen() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <HistoryScreen />
      </LanguageProvider>
    </ThemeProvider>
  );
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the empty state when storage returns no results', async () => {
    mockedGetResults.mockResolvedValueOnce([]);

    const { findByText } = renderHistoryScreen();

    expect(await findByText('No results yet')).toBeTruthy();
    expect(
      await findByText('Finish an activity to see your history grow.')
    ).toBeTruthy();
  });

  it('renders one card per stored result with the team name visible', async () => {
    const results: Result[] = [
      {
        id: 'res-1',
        activityId: 'reaction',
        teamName: 'Falcons',
        members: ['Alice'],
        result: 220,
        timestamp: 1700000000000,
      },
      {
        id: 'res-2',
        activityId: 'sound',
        teamName: 'Hawks',
        members: ['Bob'],
        result: 78,
        timestamp: 1700000100000,
      },
    ];
    mockedGetResults.mockResolvedValueOnce(results);

    const { findByText, queryByText } = renderHistoryScreen();

    // Both team names should be rendered inside their result cards.
    await waitFor(() => {
      expect(findByText(/Falcons/)).toBeTruthy();
    });
    expect(await findByText(/Falcons/)).toBeTruthy();
    expect(await findByText(/Hawks/)).toBeTruthy();

    // The empty state must NOT appear when there are results.
    expect(queryByText('No results yet')).toBeNull();
  });
});
