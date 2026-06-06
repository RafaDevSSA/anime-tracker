import { getDatabase } from './schema';

export interface AppSettings {
  checkHour: number;       // 0-23, default 8
  quietStart: number;      // 0-23, default 22
  quietEnd: number;        // 0-23, default 8
}

const DEFAULTS: AppSettings = { checkHour: 8, quietStart: 22, quietEnd: 8 };

export const SettingsRepository = {
  async get(): Promise<AppSettings> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      checkHour: map.checkHour != null ? Number(map.checkHour) : DEFAULTS.checkHour,
      quietStart: map.quietStart != null ? Number(map.quietStart) : DEFAULTS.quietStart,
      quietEnd: map.quietEnd != null ? Number(map.quietEnd) : DEFAULTS.quietEnd,
    };
  },

  async set(key: keyof AppSettings, value: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, String(value)]
    );
  },
};
