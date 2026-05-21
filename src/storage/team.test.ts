import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../types/Team';
import { saveTeam, loadTeam, clearTeam } from './team';

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    name: 'Falcons',
    members: ['Alice', 'Bob'],
    grade: 'Y9',
    createdAt: 1700000000000,
    ...overrides,
  };
}

describe('storage/team', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('loadTeam returns null when nothing is stored', async () => {
    await expect(loadTeam()).resolves.toBeNull();
  });

  it('saveTeam then loadTeam returns the same team', async () => {
    const team = makeTeam();
    await saveTeam(team);
    await expect(loadTeam()).resolves.toEqual(team);
  });

  it('clearTeam removes the team', async () => {
    await saveTeam(makeTeam());
    await clearTeam();
    await expect(loadTeam()).resolves.toBeNull();
  });
});
