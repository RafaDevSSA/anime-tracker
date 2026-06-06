export interface Anime {
  id: number;
  name: string;
  mal_id: number | null;
  anilist_id: number | null;
  cover_url: string | null;
  status: 'airing' | 'completed' | 'unknown';
  created_at: string;
}

export interface Episode {
  id: number;
  anime_id: number;
  episode_num: number;
  air_date: string;
  fetched_at: string;
}

export interface AnimeCandidate {
  mal_id: number;
  name: string;
  cover_url: string | null;
  status: string;
  score: number | null;
}

export interface AnimeDetail {
  mal_id: number;
  name: string;
  synopsis: string | null;
  cover_url: string | null;
  total_episodes: number | null;
  score: number | null;
  status: string;
  schedule: WeekSchedule | null;
}

export interface TodayEpisode {
  mal_id: number;
  ep_num: number;
  title: string;
  air_time: string | null;
}

export interface WeekSchedule {
  day_of_week: string;
  air_time: string | null;
  timezone: string | null;
}

export interface AnimeWithEpisode extends Anime {
  episode_num: number;
  air_time: string | null;
}
