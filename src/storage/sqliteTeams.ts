import { Team } from '../types/Team';
import { getDatabase, initDatabase } from './sqliteDb';

const SINGLE_TEAM_ID = 'current';

type TeamRow = {
  id: string;
  name: string;
  members: string;
  grade: string | null;
  created_at: number;
  updated_at: number;
};

function safeParseMembers(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m): m is string => typeof m === 'string');
  } catch {
    return [];
  }
}

function safeStringifyMembers(members: string[] | undefined): string {
  try {
    return JSON.stringify(Array.isArray(members) ? members : []);
  } catch {
    return '[]';
  }
}

async function db() {
  try {
    return getDatabase();
  } catch {
    return await initDatabase();
  }
}

export async function saveTeamSqlite(team: Team): Promise<void> {
  const conn = await db();
  const now = Date.now();
  const createdAt = team.createdAt ?? now;
  await conn.runAsync(
    `INSERT OR REPLACE INTO teams
       (id, name, members, grade, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      SINGLE_TEAM_ID,
      team.name,
      safeStringifyMembers(team.members),
      team.grade ?? null,
      createdAt,
      now,
    ]
  );
  console.log('[sqliteTeams] Saved team:', team.name);
}

export async function getTeamSqlite(): Promise<Team | null> {
  const conn = await db();
  const row = await conn.getFirstAsync<TeamRow>(
    'SELECT * FROM teams WHERE id = ? LIMIT 1',
    [SINGLE_TEAM_ID]
  );
  if (!row) return null;
  return {
    name: row.name,
    members: safeParseMembers(row.members),
    grade: row.grade ?? '',
    createdAt: row.created_at,
  };
}

export async function updateTeamSqlite(team: Team): Promise<void> {
  const conn = await db();
  const now = Date.now();
  const result = await conn.runAsync(
    `UPDATE teams
       SET name = ?, members = ?, grade = ?, updated_at = ?
     WHERE id = ?`,
    [
      team.name,
      safeStringifyMembers(team.members),
      team.grade ?? null,
      now,
      SINGLE_TEAM_ID,
    ]
  );
  if (result.changes === 0) {
    await saveTeamSqlite(team);
  } else {
    console.log('[sqliteTeams] Updated team:', team.name);
  }
}

export async function deleteTeamSqlite(): Promise<void> {
  const conn = await db();
  await conn.runAsync('DELETE FROM teams WHERE id = ?', [SINGLE_TEAM_ID]);
  console.log('[sqliteTeams] Deleted current team');
}
