jest.mock('./firebase', () => ({ auth: { __mock: 'auth' } }));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  listenToAuthChanges,
  getFriendlyAuthError,
} from './authService';

const mockedCreate = createUserWithEmailAndPassword as jest.MockedFunction<
  typeof createUserWithEmailAndPassword
>;
const mockedSignIn = signInWithEmailAndPassword as jest.MockedFunction<
  typeof signInWithEmailAndPassword
>;
const mockedSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockedOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<
  typeof onAuthStateChanged
>;

describe('getFriendlyAuthError', () => {
  const cases: Array<[string, RegExp]> = [
    ['auth/invalid-email', /valid email/i],
    ['auth/missing-email', /enter an email/i],
    ['auth/missing-password', /enter a password/i],
    ['auth/weak-password', /at least 6 characters/i],
    ['auth/email-already-in-use', /already registered/i],
    ['auth/user-not-found', /no account found/i],
    ['auth/wrong-password', /email or password is incorrect/i],
    ['auth/invalid-credential', /email or password is incorrect/i],
    ['auth/too-many-requests', /too many attempts/i],
    ['auth/network-request-failed', /network error/i],
  ];

  it.each(cases)('returns the friendly message for %s', (code, matcher) => {
    expect(getFriendlyAuthError({ code })).toMatch(matcher);
  });

  it('falls through to the default message for an unknown code', () => {
    expect(getFriendlyAuthError({ code: 'auth/totally-made-up' })).toMatch(
      /something went wrong/i
    );
  });

  it('falls through to the default message when err has no code', () => {
    expect(getFriendlyAuthError(new Error('boom'))).toMatch(
      /something went wrong/i
    );
    expect(getFriendlyAuthError(null)).toMatch(/something went wrong/i);
    expect(getFriendlyAuthError('not-an-object')).toMatch(/something went wrong/i);
  });
});

describe('signInWithEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls signInWithEmailAndPassword with trimmed email and returns the user', async () => {
    const fakeUser = { uid: 'u-1' };
    mockedSignIn.mockResolvedValueOnce({ user: fakeUser } as never);

    const result = await signInWithEmail('  alice@example.com  ', 'hunter2');

    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    expect(mockedSignIn).toHaveBeenCalledWith(
      { __mock: 'auth' },
      'alice@example.com',
      'hunter2'
    );
    expect(result).toBe(fakeUser);
  });
});

describe('signUpWithEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls createUserWithEmailAndPassword with trimmed email and returns the user', async () => {
    const fakeUser = { uid: 'u-2' };
    mockedCreate.mockResolvedValueOnce({ user: fakeUser } as never);

    const result = await signUpWithEmail('  bob@example.com\n', 'pw123456');

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledWith(
      { __mock: 'auth' },
      'bob@example.com',
      'pw123456'
    );
    expect(result).toBe(fakeUser);
  });
});

describe('signOutUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls signOut with the auth instance', async () => {
    mockedSignOut.mockResolvedValueOnce(undefined as never);

    await signOutUser();

    expect(mockedSignOut).toHaveBeenCalledTimes(1);
    expect(mockedSignOut).toHaveBeenCalledWith({ __mock: 'auth' });
  });
});

describe('listenToAuthChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the unsubscribe function from onAuthStateChanged', () => {
    const unsubscribe = jest.fn();
    mockedOnAuthStateChanged.mockReturnValueOnce(unsubscribe as never);

    const callback = jest.fn();
    const result = listenToAuthChanges(callback);

    expect(mockedOnAuthStateChanged).toHaveBeenCalledTimes(1);
    const [authArg, cbArg, errArg] = mockedOnAuthStateChanged.mock.calls[0];
    expect(authArg).toEqual({ __mock: 'auth' });
    expect(cbArg).toBe(callback);
    expect(typeof errArg).toBe('function');
    expect(result).toBe(unsubscribe);
  });
});
