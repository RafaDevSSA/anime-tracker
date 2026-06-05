import { AnimeRepository } from '../../src/db/AnimeRepository';
import { EpisodeRepository } from '../../src/db/EpisodeRepository';
import type { Anime, Episode } from '../../src/types';

type Operation = 'insertAnime' | 'findAllAnimes' | 'findAnimeById' | 'deleteAnime' | 'upsertEpisode' | 'getTodayEpisodes';

interface Input {
  operation: Operation;
  payload?: Record<string, unknown>;
}

export async function run(input: Input): Promise<unknown> {
  const { operation, payload = {} } = input;

  switch (operation) {
    case 'insertAnime': {
      const id = await AnimeRepository.insert(payload as Omit<Anime, 'id' | 'created_at'>);
      return { id };
    }
    case 'findAllAnimes':
      return AnimeRepository.findAll();
    case 'findAnimeById':
      return AnimeRepository.findById(payload.id as number);
    case 'deleteAnime':
      await AnimeRepository.delete(payload.id as number);
      return { deleted: true };
    case 'upsertEpisode':
      await EpisodeRepository.upsert(payload as Omit<Episode, 'id' | 'fetched_at'>);
      return { ok: true };
    case 'getTodayEpisodes':
      return EpisodeRepository.findTodayAll();
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
