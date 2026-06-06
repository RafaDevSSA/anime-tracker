import type { AnimeCandidate, AnimeDetail, WeekSchedule } from '../../types';

const BASE_URL = 'https://api.jikan.moe/v4';

async function jikanFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (res.status === 429) {
    const err = new Error('Rate limited');
    (err as any).status = 429;
    throw err;
  }
  if (!res.ok) throw new Error(`Jikan error: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

interface JikanAnime {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  status: string;
  score: number | null;
}

interface JikanAnimeDetail extends JikanAnime {
  synopsis: string | null;
  episodes: number | null;
  broadcast: { day: string | null; time: string | null; timezone: string | null };
}

function mapStatus(s: string): 'airing' | 'completed' | 'unknown' {
  if (s === 'Currently Airing') return 'airing';
  if (s === 'Finished Airing') return 'completed';
  return 'unknown';
}

export async function searchAnime(name: string): Promise<AnimeCandidate[]> {
  const data = await jikanFetch<JikanAnime[]>(`/anime?q=${encodeURIComponent(name)}&limit=10`);
  return data.map((a) => ({
    mal_id: a.mal_id,
    name: a.title,
    cover_url: a.images?.jpg?.image_url ?? null,
    status: mapStatus(a.status),
    score: a.score,
  }));
}

export async function getAnimeDetails(mal_id: number): Promise<AnimeDetail> {
  const a = await jikanFetch<JikanAnimeDetail>(`/anime/${mal_id}/full`);
  const schedule: WeekSchedule | null = a.broadcast?.day
    ? { day_of_week: a.broadcast.day, air_time: a.broadcast.time, timezone: a.broadcast.timezone }
    : null;
  return {
    mal_id: a.mal_id,
    name: a.title,
    synopsis: a.synopsis,
    cover_url: a.images?.jpg?.image_url ?? null,
    total_episodes: a.episodes,
    score: a.score ?? null,
    status: mapStatus(a.status),
    schedule,
  };
}
