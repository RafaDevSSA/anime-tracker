import { useState, useEffect, useCallback } from 'react';
import { EpisodeRepository } from '../db/EpisodeRepository';
import { AnimeRepository } from '../db/AnimeRepository';
import type { AnimeWithEpisode } from '../types';

export function useTodaySchedule() {
  const [schedule, setSchedule] = useState<AnimeWithEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const episodes = await EpisodeRepository.findTodayAll();
      const items: AnimeWithEpisode[] = [];
      for (const ep of episodes) {
        const anime = await AnimeRepository.findById(ep.anime_id);
        if (anime) items.push({ ...anime, episode_num: ep.episode_num, air_time: null });
      }
      setSchedule(items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { schedule, loading, error, refresh };
}
