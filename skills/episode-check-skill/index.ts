import type { TodayEpisode } from '../../src/types';
import { AnimeRepository } from '../../src/db/AnimeRepository';
import { EpisodeRepository } from '../../src/db/EpisodeRepository';

const MCP_BASE_URL = process.env.SCHEDULE_SCRAPER_MCP_URL ?? 'http://localhost:3002';

interface CheckResult {
  episodes: TodayEpisode[];
  persisted: number;
}

export async function run(input: { mal_ids: number[] }): Promise<CheckResult> {
  const res = await fetch(`${MCP_BASE_URL}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: 'get_today_episodes', params: { mal_ids: input.mal_ids } }),
  });

  if (!res.ok) throw new Error(`schedule-scraper-mcp error: ${res.status}`);
  const episodes: TodayEpisode[] = await res.json();

  const today = new Date().toISOString().split('T')[0];
  let persisted = 0;

  for (const ep of episodes) {
    const anime = await AnimeRepository.findByMalId(ep.mal_id);
    if (!anime) continue;
    await EpisodeRepository.upsert({ anime_id: anime.id, episode_num: ep.ep_num, air_date: today });
    persisted++;
  }

  return { episodes, persisted };
}
