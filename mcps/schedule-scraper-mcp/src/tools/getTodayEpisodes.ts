import { episodeCache } from '../cache/episodeCache';

const BASE_URL = 'https://api.jikan.moe/v4';

export interface TodayEpisode {
  mal_id: number;
  ep_num: number;
  title: string;
  air_time: string | null;
}

async function fetchScheduleForId(mal_id: number): Promise<TodayEpisode | null> {
  const cacheKey = `today:${mal_id}`;
  const cached = episodeCache.get<TodayEpisode | null>(cacheKey);
  if (cached !== undefined) return cached;

  const res = await fetch(`${BASE_URL}/anime/${mal_id}/full`);
  if (!res.ok) {
    episodeCache.set(cacheKey, null);
    return null;
  }
  const json = await res.json();
  const data = json.data;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const broadcastDay: string | null = data.broadcast?.day ?? null;

  let result: TodayEpisode | null = null;
  if (broadcastDay && broadcastDay.toLowerCase().startsWith(today.toLowerCase())) {
    result = {
      mal_id,
      ep_num: data.episodes ?? 0,
      title: data.title,
      air_time: data.broadcast?.time ?? null,
    };
  }

  episodeCache.set(cacheKey, result);
  return result;
}

export async function getTodayEpisodes(mal_ids: number[]): Promise<TodayEpisode[]> {
  const results = await Promise.allSettled(mal_ids.map(fetchScheduleForId));
  return results
    .filter((r): r is PromiseFulfilledResult<TodayEpisode> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);
}
