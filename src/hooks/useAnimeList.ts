import { useState, useEffect, useCallback } from 'react';
import { AnimeService } from '../services/AnimeService';
import { showError } from '../utils/alert';
import type { Anime } from '../types';

export function useAnimeList() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AnimeService.getAll();
      setAnimes(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = useCallback(async (id: number) => {
    try {
      await AnimeService.remove(id);
      setAnimes((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      showError('Erro', e.message ?? 'Não foi possível remover o anime.');
    }
  }, []);

  return { animes, loading, error, refresh, remove };
}
