import { getDatabase } from './schema';
import type { Anime } from '../types';

export const AnimeRepository = {
  async findAll(): Promise<Anime[]> {
    const db = getDatabase();
    return db.getAllAsync<Anime>('SELECT * FROM animes ORDER BY name ASC');
  },

  async findById(id: number): Promise<Anime | null> {
    const db = getDatabase();
    return db.getFirstAsync<Anime>('SELECT * FROM animes WHERE id = ?', [id]);
  },

  async findByMalId(mal_id: number): Promise<Anime | null> {
    const db = getDatabase();
    return db.getFirstAsync<Anime>('SELECT * FROM animes WHERE mal_id = ?', [mal_id]);
  },

  async getAllMalIds(): Promise<number[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{ mal_id: number }>(
      'SELECT mal_id FROM animes WHERE mal_id IS NOT NULL'
    );
    return rows.map((r) => r.mal_id);
  },

  async insert(anime: Omit<Anime, 'id' | 'created_at'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      `INSERT INTO animes (name, mal_id, anilist_id, cover_url, status)
       VALUES (?, ?, ?, ?, ?)`,
      [anime.name, anime.mal_id, anime.anilist_id, anime.cover_url, anime.status]
    );
    return result.lastInsertRowId;
  },

  async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM animes WHERE id = ?', [id]);
  },
};
