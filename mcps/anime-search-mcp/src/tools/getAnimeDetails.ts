import * as jikan from '../adapters/jikan.adapter';
import * as anilist from '../adapters/anilist.adapter';
import type { AnimeDetail } from '../../types';

const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getAnimeDetails(mal_id: number): Promise<AnimeDetail> {
  try {
    return await jikan.getAnimeDetails(mal_id);
  } catch (err: any) {
    if (err.status === 429) {
      await sleep(RETRY_DELAY_MS);
      return anilist.getAnimeDetails(mal_id);
    }
    throw err;
  }
}
