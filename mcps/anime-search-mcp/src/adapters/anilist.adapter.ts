import type { AnimeCandidate, AnimeDetail } from '../../types';

const GRAPHQL_URL = 'https://graphql.anilist.co';

async function anilistQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

const SEARCH_QUERY = `
  query SearchAnime($search: String) {
    Page(perPage: 10) {
      media(search: $search, type: ANIME) {
        id
        title { romaji english }
        coverImage { medium }
        status
        averageScore
      }
    }
  }
`;

const DETAIL_QUERY = `
  query AnimeDetail($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english }
      description
      coverImage { large }
      episodes
      status
      averageScore
      nextAiringEpisode { airingAt }
    }
  }
`;

function mapStatus(s: string): 'airing' | 'completed' | 'unknown' {
  if (s === 'RELEASING') return 'airing';
  if (s === 'FINISHED') return 'completed';
  return 'unknown';
}

export async function searchAnime(name: string): Promise<AnimeCandidate[]> {
  const data = await anilistQuery<any>(SEARCH_QUERY, { search: name });
  return data.Page.media.map((m: any) => ({
    mal_id: m.id,
    name: m.title.english ?? m.title.romaji,
    cover_url: m.coverImage?.medium ?? null,
    status: mapStatus(m.status),
    score: m.averageScore ? m.averageScore / 10 : null,
  }));
}

export async function getAnimeDetails(anilist_id: number): Promise<AnimeDetail> {
  const data = await anilistQuery<any>(DETAIL_QUERY, { id: anilist_id });
  const m = data.Media;
  return {
    mal_id: m.id,
    name: m.title.english ?? m.title.romaji,
    synopsis: m.description ?? null,
    cover_url: m.coverImage?.large ?? null,
    total_episodes: m.episodes ?? null,
    score: m.averageScore ? m.averageScore / 10 : null,
    status: mapStatus(m.status),
    schedule: null,
  };
}
