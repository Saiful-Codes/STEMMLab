import { Result } from '../types/Result';
import { getDatabase, initDatabase } from './sqliteDb';

export type SqliteResult = Result & {
  resultLabel?: string;
};

type ResultRow = {
  id: string;
  activity_id: string;
  team_name: string | null;
  members: string | null;
  result_value: string;
  result_label: string | null;
  rating: number | null;
  comment: string | null;
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

function rowToResult(row: ResultRow): SqliteResult {
  return {
    id: row.id,
    activityId: row.activity_id,
    teamName: row.team_name ?? '',
    members: safeParseMembers(row.members),
    result: row.result_value,
    timestamp: row.created_at,
    rating: row.rating ?? undefined,
    comment: row.comment ?? undefined,
    resultLabel: row.result_label ?? undefined,
  };
}

async function db() {
  try {
    return getDatabase();
  } catch {
    return await initDatabase();
  }
}

export async function saveActivityResultSqlite(result: SqliteResult): Promise<void> {
  const conn = await db();
  const now = Date.now();
  const createdAt = result.timestamp ?? now;
  await conn.runAsync(
    `INSERT OR REPLACE INTO activity_results
       (id, activity_id, team_name, members, result_value, result_label,
        rating, comment, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.id,
      result.activityId,
      result.teamName ?? null,
      safeStringifyMembers(result.members),
      String(result.result),
      result.resultLabel ?? null,
      result.rating ?? null,
      result.comment ?? null,
      createdAt,
      now,
    ]
  );
  console.log('[sqliteResults] Saved result:', result.id, 'for', result.activityId);
}

export async function getActivityResultsSqlite(): Promise<SqliteResult[]> {
  const conn = await db();
  const rows = await conn.getAllAsync<ResultRow>(
    'SELECT * FROM activity_results ORDER BY created_at DESC'
  );
  return rows.map(rowToResult);
}

export async function getActivityResultsByActivitySqlite(
  activityId: string
): Promise<SqliteResult[]> {
  const conn = await db();
  const rows = await conn.getAllAsync<ResultRow>(
    'SELECT * FROM activity_results WHERE activity_id = ? ORDER BY created_at DESC',
    [activityId]
  );
  return rows.map(rowToResult);
}

export async function updateActivityResultSqlite(result: SqliteResult): Promise<void> {
  const conn = await db();
  const now = Date.now();
  const res = await conn.runAsync(
    `UPDATE activity_results
       SET activity_id = ?, team_name = ?, members = ?, result_value = ?,
           result_label = ?, rating = ?, comment = ?, updated_at = ?
     WHERE id = ?`,
    [
      result.activityId,
      result.teamName ?? null,
      safeStringifyMembers(result.members),
      String(result.result),
      result.resultLabel ?? null,
      result.rating ?? null,
      result.comment ?? null,
      now,
      result.id,
    ]
  );
  if (res.changes === 0) {
    await saveActivityResultSqlite(result);
  } else {
    console.log('[sqliteResults] Updated result:', result.id);
  }
}

export async function deleteActivityResultSqlite(id: string): Promise<void> {
  const conn = await db();
  await conn.runAsync('DELETE FROM activity_results WHERE id = ?', [id]);
  console.log('[sqliteResults] Deleted result:', id);
}

export async function clearActivityResultsSqlite(): Promise<void> {
  const conn = await db();
  await conn.runAsync('DELETE FROM activity_results');
  console.log('[sqliteResults] Cleared all activity results');
}
