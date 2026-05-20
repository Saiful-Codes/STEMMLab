import { Result } from '../types/Result';
import { Team } from '../types/Team';

jest.mock('./firebase', () => ({ db: { __mock: 'db' } }));

jest.mock('./authService', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(() => '__server_ts__'),
}));

import {
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { getCurrentUser } from './authService';
import {
  saveActivityResultToFirestore,
  saveTeamToFirestore,
  getActivityResultsFromFirestore,
} from './firestoreService';

const mockedDoc = doc as jest.MockedFunction<typeof doc>;
const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockedGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedWhere = where as jest.MockedFunction<typeof where>;
const mockedCollection = collection as jest.MockedFunction<typeof collection>;
const mockedServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

function makeResult(overrides: Partial<Result> = {}): Result {
  return {
    id: 'res-1',
    activityId: 'reaction',
    teamName: 'Team A',
    members: ['Alice'],
    result: 200,
    timestamp: 1700000000000,
    ...overrides,
  };
}

describe('saveActivityResultToFirestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedServerTimestamp.mockReturnValue('__server_ts__' as never);
  });

  it('throws when no user is signed in', async () => {
    mockedGetCurrentUser.mockReturnValue(null as never);
    await expect(saveActivityResultToFirestore(makeResult())).rejects.toThrow(
      /not signed in/i
    );
    expect(mockedSetDoc).not.toHaveBeenCalled();
  });

  it('calls setDoc at activityResults/{result.id} with userId and syncedAt', async () => {
    mockedGetCurrentUser.mockReturnValue({ uid: 'user-123' } as never);
    const fakeRef = { __ref: 'activityResults/res-1' };
    mockedDoc.mockReturnValueOnce(fakeRef as never);
    mockedSetDoc.mockResolvedValueOnce(undefined as never);

    const r = makeResult({ id: 'res-1' });
    await saveActivityResultToFirestore(r);

    expect(mockedDoc).toHaveBeenCalledWith(
      { __mock: 'db' },
      'activityResults',
      'res-1'
    );
    expect(mockedSetDoc).toHaveBeenCalledTimes(1);
    const [refArg, payload] = mockedSetDoc.mock.calls[0];
    expect(refArg).toBe(fakeRef);
    expect(payload).toMatchObject({
      id: 'res-1',
      activityId: 'reaction',
      userId: 'user-123',
      syncedAt: '__server_ts__',
    });
  });

  it('uses the same doc id when re-called with the same result.id (idempotent)', async () => {
    mockedGetCurrentUser.mockReturnValue({ uid: 'user-123' } as never);
    mockedDoc.mockReturnValue({ __ref: 'activityResults/res-1' } as never);
    mockedSetDoc.mockResolvedValue(undefined as never);

    const r = makeResult({ id: 'res-1' });
    await saveActivityResultToFirestore(r);
    await saveActivityResultToFirestore(r);

    expect(mockedDoc).toHaveBeenCalledTimes(2);
    expect(mockedDoc.mock.calls[0]).toEqual([{ __mock: 'db' }, 'activityResults', 'res-1']);
    expect(mockedDoc.mock.calls[1]).toEqual([{ __mock: 'db' }, 'activityResults', 'res-1']);
    expect(mockedSetDoc).toHaveBeenCalledTimes(2);
  });
});

describe('saveTeamToFirestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedServerTimestamp.mockReturnValue('__server_ts__' as never);
  });

  it('calls setDoc at teams/{uid} with merge: true', async () => {
    mockedGetCurrentUser.mockReturnValue({ uid: 'user-xyz' } as never);
    const fakeRef = { __ref: 'teams/user-xyz' };
    mockedDoc.mockReturnValueOnce(fakeRef as never);
    mockedSetDoc.mockResolvedValueOnce(undefined as never);

    const team: Team = {
      name: 'Falcons',
      members: ['Alice', 'Bob'],
      grade: 'Y9',
      createdAt: 1700000000000,
    };

    await saveTeamToFirestore(team);

    expect(mockedDoc).toHaveBeenCalledWith({ __mock: 'db' }, 'teams', 'user-xyz');
    expect(mockedSetDoc).toHaveBeenCalledTimes(1);
    const [refArg, payload, options] = mockedSetDoc.mock.calls[0];
    expect(refArg).toBe(fakeRef);
    expect(payload).toMatchObject({
      name: 'Falcons',
      members: ['Alice', 'Bob'],
      grade: 'Y9',
      userId: 'user-xyz',
      syncedAt: '__server_ts__',
    });
    expect(options).toEqual({ merge: true });
  });
});

describe('getActivityResultsFromFirestore', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockedQuery.mockReturnValue('__query__' as never);
    mockedWhere.mockReturnValue('__where__' as never);
    mockedCollection.mockReturnValue('__collection__' as never);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns parsed results sorted newest-first', async () => {
    mockedGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'a',
          data: () => ({
            id: 'a',
            activityId: 'reaction',
            teamName: 'T',
            members: ['A'],
            result: 200,
            timestamp: 1000,
          }),
        },
        {
          id: 'b',
          data: () => ({
            id: 'b',
            activityId: 'reaction',
            teamName: 'T',
            members: ['A'],
            result: 180,
            timestamp: 3000,
          }),
        },
        {
          id: 'c',
          data: () => ({
            id: 'c',
            activityId: 'reaction',
            teamName: 'T',
            members: ['A'],
            result: 220,
            timestamp: 2000,
          }),
        },
      ],
    } as never);

    const results = await getActivityResultsFromFirestore('user-1');
    expect(results.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(results.map((r) => r.timestamp)).toEqual([3000, 2000, 1000]);
  });

  it('skips a malformed doc and still returns the valid ones', async () => {
    mockedGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'good-1',
          data: () => ({
            id: 'good-1',
            activityId: 'reaction',
            teamName: 'T',
            members: ['A'],
            result: 200,
            timestamp: 1000,
          }),
        },
        {
          id: 'bad-1',
          data: () => {
            throw new Error('corrupted doc');
          },
        },
        {
          id: 'good-2',
          data: () => ({
            id: 'good-2',
            activityId: 'reaction',
            teamName: 'T',
            members: ['A'],
            result: 180,
            timestamp: 2000,
          }),
        },
      ],
    } as never);

    const results = await getActivityResultsFromFirestore('user-1');
    expect(results.map((r) => r.id)).toEqual(['good-2', 'good-1']);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[firestoreService]'),
      'bad-1',
      expect.any(Error)
    );
  });
});
