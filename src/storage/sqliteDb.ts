import * as SQLite from 'expo-sqlite';

const DB_NAME = 'stemmlab.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[sqliteDb] Opening database:', DB_NAME);
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          members TEXT NOT NULL,
          grade TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS activity_results (
          id TEXT PRIMARY KEY NOT NULL,
          activity_id TEXT NOT NULL,
          team_name TEXT,
          members TEXT,
          result_value TEXT NOT NULL,
          result_label TEXT,
          rating INTEGER,
          comment TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_activity_results_activity_id
          ON activity_results(activity_id);

        CREATE INDEX IF NOT EXISTS idx_activity_results_created_at
          ON activity_results(created_at DESC);
      `);

      await db.runAsync(
        'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
        ['initialized_at', new Date().toISOString()]
      );

      dbInstance = db;
      console.log('[sqliteDb] Database ready');
      return db;
    } catch (err) {
      initPromise = null;
      console.error('[sqliteDb] Failed to initialise database:', err);
      throw err;
    }
  })();

  return initPromise;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('SQLite database not initialised. Call initDatabase() first.');
  }
  return dbInstance;
}
