import * as jikan from '../adapters/jikan.adapter';
import * as anilist from '../adapters/anilist.adapter';
import type { AnimeCandidate } from '../../types';

const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function searchAnime(name: string): Promise<AnimeCandidate[]> {
  try {
    return await jikan.searchAnime(name);
  } catch (err: any) {
    if (err.status === 429) {
      await sleep(RETRY_DELAY_MS);
      return anilist.searchAnime(name);
    }
    throw err;
  }
}
