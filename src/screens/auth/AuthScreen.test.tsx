import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

// Mock authService directly — avoid jest.requireActual on it because the real
// module transitively imports firebase/auth (an ESM file Jest cannot parse).
// Re-implement the small friendly-error mapping inline; getFriendlyAuthError
// itself is unit-tested in authService.test.ts.
jest.mock('../../services/authService', () => ({
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  getFriendlyAuthError: (err: unknown) => {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : '';
    if (code === 'auth/invalid-email') return "That doesn't look like a valid email.";
    return 'Something went wrong. Please try again.';
  },
}));

import { ThemeProvider } from '../../context/ThemeContext';
import AuthScreen from './AuthScreen';
import { signInWithEmail } from '../../services/authService';

const mockedSignIn = signInWithEmail as jest.MockedFunction<typeof signInWithEmail>;

function makeNavigationStub() {
  return {
    goBack: jest.fn(),
    navigate: jest.fn(),
    addListener: jest.fn(() => () => undefined),
    removeListener: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
  };
}

function renderAuthScreen() {
  const navigation = makeNavigationStub();
  const route = { key: 'Auth', name: 'Auth' as const, params: undefined };
  const utils = render(
    <ThemeProvider>
      {/* @ts-expect-error — we pass a structural stub instead of the real navigator props */}
      <AuthScreen navigation={navigation} route={route} />
    </ThemeProvider>
  );
  return { ...utils, navigation };
}

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the heading, email field, and password field', async () => {
    const { findAllByText, getByPlaceholderText } = renderAuthScreen();

    // "Sign in" appears as heading, toggle tab, and submit button.
    // findAllByText also lets the ThemeProvider's async preference-load settle.
    const signInMatches = await findAllByText('Sign in');
    expect(signInMatches.length).toBeGreaterThanOrEqual(2);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('At least 6 characters')).toBeTruthy();
  });

  it('shows the friendly inline error when the auth service rejects with auth/invalid-email', async () => {
    mockedSignIn.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    const { getByPlaceholderText, getAllByText, findByText } = renderAuthScreen();

    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'not-an-email'
    );
    fireEvent.changeText(getByPlaceholderText('At least 6 characters'), 'pw1234');

    // Press the submit button (the last "Sign in" text is inside the submit Pressable).
    const signInElements = getAllByText('Sign in');
    fireEvent.press(signInElements[signInElements.length - 1]);

    expect(await findByText("That doesn't look like a valid email.")).toBeTruthy();
    expect(mockedSignIn).toHaveBeenCalledTimes(1);
  });

  it('shows the empty-email validation message when submit is pressed with no email', async () => {
    const { getAllByText, findByText } = renderAuthScreen();

    const signInElements = getAllByText('Sign in');
    fireEvent.press(signInElements[signInElements.length - 1]);

    expect(await findByText('Please enter an email.')).toBeTruthy();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('enters a loading state while the submit promise is pending (submit text replaced by spinner)', async () => {
    // Controllable promise — never resolves during the test, so the loading state stays.
    let resolveSignIn: (value: unknown) => void = () => undefined;
    mockedSignIn.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );

    const { getByPlaceholderText, getAllByText } = renderAuthScreen();

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alice@example.com');
    fireEvent.changeText(getByPlaceholderText('At least 6 characters'), 'hunter2');

    const beforeSubmit = getAllByText('Sign in').length;
    const submitTarget = getAllByText('Sign in')[beforeSubmit - 1];

    await act(async () => {
      fireEvent.press(submitTarget);
    });

    // While the submit promise is pending, the button label is replaced by the spinner,
    // so the count of "Sign in" text occurrences drops by exactly one.
    await waitFor(() => {
      expect(getAllByText('Sign in').length).toBe(beforeSubmit - 1);
    });

    // Tear down — resolve the dangling promise so React doesn't warn about act().
    await act(async () => {
      resolveSignIn(undefined);
    });
  });
});
