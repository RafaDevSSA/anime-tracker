import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('animetracker.db');
  await runMigrations(_db);
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS animes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mal_id INTEGER,
      anilist_id INTEGER,
      cover_url TEXT,
      status TEXT DEFAULT 'airing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anime_id INTEGER REFERENCES animes(id) ON DELETE CASCADE,
      episode_num INTEGER,
      air_date DATE,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(anime_id, episode_num)
    );

    CREATE INDEX IF NOT EXISTS idx_animes_mal_id ON animes(mal_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes(anime_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_air_date ON episodes(air_date);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
