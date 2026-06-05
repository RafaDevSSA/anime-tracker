import type { TodayEpisode } from '../../src/types';

interface NotificationPayload {
  title: string;
  body: string;
  data: { mal_ids: number[]; date: string };
}

export function run(input: { episodes: TodayEpisode[] }): NotificationPayload {
  const { episodes } = input;

  if (episodes.length === 0) {
    throw new Error('No episodes to notify about');
  }

  const lines = episodes.map((ep) => `${ep.title} ep ${ep.ep_num}`);
  const count = episodes.length;

  return {
    title: count === 1 ? '1 anime novo hoje!' : `${count} animes novos hoje!`,
    body: lines.join('\n'),
    data: {
      mal_ids: episodes.map((ep) => ep.mal_id),
      date: new Date().toISOString().split('T')[0],
    },
  };
}
