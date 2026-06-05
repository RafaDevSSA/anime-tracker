import type { AnimeCandidate } from '../../src/types';

const MCP_BASE_URL = process.env.ANIME_SEARCH_MCP_URL ?? 'http://localhost:3001';

interface SearchResult {
  best: AnimeCandidate & { confidence: number };
  candidates: AnimeCandidate[];
}

export async function run(input: { name: string }): Promise<SearchResult> {
  const res = await fetch(`${MCP_BASE_URL}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: 'search_anime', params: { name: input.name } }),
  });

  if (!res.ok) throw new Error(`anime-search-mcp error: ${res.status}`);
  const candidates: AnimeCandidate[] = await res.json();

  if (candidates.length === 0) {
    throw new Error(`No results found for: ${input.name}`);
  }

  const sorted = [...candidates].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const best = sorted[0];
  const maxScore = best.score ?? 10;
  const confidence = maxScore / 10;

  return {
    best: { ...best, confidence: Math.min(confidence, 1) },
    candidates: sorted,
  };
}
