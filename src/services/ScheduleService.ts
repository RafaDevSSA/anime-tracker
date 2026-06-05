import { AnimeRepository } from '../db/AnimeRepository';
import { EpisodeRepository } from '../db/EpisodeRepository';
import type { TodayEpisode } from '../types';

const MCP_BASE_URL = process.env.EXPO_PUBLIC_SCHEDULE_MCP_URL ?? 'http://localhost:3002';

export const ScheduleService = {
  async refreshTodayEpisodes(): Promise<TodayEpisode[]> {
    const mal_ids = await AnimeRepository.getAllMalIds();
    if (mal_ids.length === 0) return [];

    const res = await fetch(`${MCP_BASE_URL}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'get_today_episodes', params: { mal_ids } }),
    });
    if (!res.ok) throw new Error('Falha ao buscar episódios do dia');

    const episodes: TodayEpisode[] = await res.json();
    const today = new Date().toISOString().split('T')[0];

    for (const ep of episodes) {
      const anime = await AnimeRepository.findByMalId(ep.mal_id);
      if (!anime) continue;
      await EpisodeRepository.upsert({ anime_id: anime.id, episode_num: ep.ep_num, air_date: today });
    }

    return episodes;
  },

  async getTodayFromDB() {
    return EpisodeRepository.findTodayAll();
  },
};
