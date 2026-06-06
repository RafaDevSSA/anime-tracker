export interface AnimeCandidate {
  mal_id: number;
  name: string;
  cover_url: string | null;
  status: 'airing' | 'completed' | 'unknown';
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

export interface WeekSchedule {
  day_of_week: string;
  air_time: string | null;
  timezone: string | null;
}
