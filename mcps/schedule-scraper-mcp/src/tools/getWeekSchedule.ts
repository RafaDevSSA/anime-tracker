import { episodeCache } from '../cache/episodeCache';

const BASE_URL = 'https://api.jikan.moe/v4';

export interface WeekSchedule {
  day_of_week: string;
  air_time: string | null;
  timezone: string | null;
}

export async function getWeekSchedule(mal_id: number): Promise<WeekSchedule | null> {
  const cacheKey = `week:${mal_id}`;
  const cached = episodeCache.get<WeekSchedule | null>(cacheKey);
  if (cached !== undefined) return cached;

  const res = await fetch(`${BASE_URL}/anime/${mal_id}/full`);
  if (!res.ok) return null;
  const json = await res.json();
  const broadcast = json.data?.broadcast;

  const result: WeekSchedule | null = broadcast?.day
    ? { day_of_week: broadcast.day, air_time: broadcast.time ?? null, timezone: broadcast.timezone ?? null }
    : null;

  episodeCache.set(cacheKey, result);
  return result;
}
