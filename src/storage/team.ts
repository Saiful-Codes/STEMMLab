import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../types/Team';

const TEAM_KEY = 'team:current';

export async function saveTeam(team: Team): Promise<void> {
  try {
    await AsyncStorage.setItem(TEAM_KEY, JSON.stringify(team));
  } catch (err) {
    console.warn('[storage/team] saveTeam failed:', err);
    throw err;
  }
}

export async function loadTeam(): Promise<Team | null> {
  try {
    const raw = await AsyncStorage.getItem(TEAM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Team;
  } catch (err) {
    console.warn('[storage/team] loadTeam failed; returning null:', err);
    return null;
  }
}

export async function clearTeam(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TEAM_KEY);
  } catch (err) {
    console.warn('[storage/team] clearTeam failed:', err);
    throw err;
  }
}
