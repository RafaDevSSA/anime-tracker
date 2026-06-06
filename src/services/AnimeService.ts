import { AnimeRepository } from '../db/AnimeRepository';
import type { Anime, AnimeCandidate, AnimeDetail } from '../types';

const MCP_BASE_URL = process.env.EXPO_PUBLIC_ANIME_SEARCH_MCP_URL ?? 'http://localhost:3001';

export const AnimeService = {
  async searchByName(name: string): Promise<AnimeCandidate[]> {
    const res = await fetch(`${MCP_BASE_URL}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'search_anime', params: { name } }),
    });
    if (!res.ok) throw new Error('Falha ao buscar anime');
    return res.json();
  },

  async addToLibrary(candidate: AnimeCandidate): Promise<number> {
    const existing = await AnimeRepository.findByMalId(candidate.mal_id);
    if (existing) return existing.id;
    return AnimeRepository.insert({
      name: candidate.name,
      mal_id: candidate.mal_id,
      anilist_id: null,
      cover_url: candidate.cover_url,
      status: (candidate.status as Anime['status']) ?? 'unknown',
    });
  },

  async getAll(): Promise<Anime[]> {
    return AnimeRepository.findAll();
  },

  async remove(id: number): Promise<void> {
    return AnimeRepository.delete(id);
  },

  async getDetails(mal_id: number): Promise<AnimeDetail> {
    const res = await fetch(`${MCP_BASE_URL}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'get_anime_details', params: { mal_id } }),
    });
    if (!res.ok) throw new Error('Falha ao buscar detalhes do anime');
    return res.json();
  },
};
