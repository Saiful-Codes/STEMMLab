import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../types/Team';

const TEAM_KEY = 'team:current';

export async function saveTeam(team: Team): Promise<void> {
  await AsyncStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export async function loadTeam(): Promise<Team | null> {
  try {
    const raw = await AsyncStorage.getItem(TEAM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Team;
  } catch {
    return null;
  }
}

export async function clearTeam(): Promise<void> {
  await AsyncStorage.removeItem(TEAM_KEY);
}
