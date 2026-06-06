import { getDatabase } from './schema';
import type { Episode } from '../types';

export const EpisodeRepository = {
  async findTodayByAnime(animeId: number): Promise<Episode[]> {
    const db = getDatabase();
    return db.getAllAsync<Episode>(
      `SELECT * FROM episodes
       WHERE anime_id = ? AND date(air_date) = date('now')`,
      [animeId]
    );
  },

  async findTodayAll(): Promise<Episode[]> {
    const db = getDatabase();
    return db.getAllAsync<Episode>(
      `SELECT * FROM episodes WHERE date(air_date) = date('now')`
    );
  },

  async upsert(episode: Omit<Episode, 'id' | 'fetched_at'>): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO episodes (anime_id, episode_num, air_date)
       VALUES (?, ?, ?)
       ON CONFLICT(anime_id, episode_num) DO UPDATE SET air_date = excluded.air_date, fetched_at = CURRENT_TIMESTAMP`,
      [episode.anime_id, episode.episode_num, episode.air_date]
    );
  },

  async upsertMany(episodes: Omit<Episode, 'id' | 'fetched_at'>[]): Promise<void> {
    const db = getDatabase();
    await db.withTransactionAsync(async () => {
      for (const ep of episodes) {
        await db.runAsync(
          `INSERT INTO episodes (anime_id, episode_num, air_date)
           VALUES (?, ?, ?)
           ON CONFLICT(anime_id, episode_num) DO UPDATE SET air_date = excluded.air_date, fetched_at = CURRENT_TIMESTAMP`,
          [ep.anime_id, ep.episode_num, ep.air_date]
        );
      }
    });
  },
};
