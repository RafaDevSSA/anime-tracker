import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { searchAnime } from './tools/searchAnime';
import { getAnimeDetails } from './tools/getAnimeDetails';

const server = new McpServer({
  name: 'anime-search-mcp',
  version: '1.0.0',
});

server.tool(
  'search_anime',
  'Search anime by name using Jikan (MAL) with AniList fallback',
  { name: z.string().describe('Anime name to search for') },
  async ({ name }) => {
    const results = await searchAnime(name);
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  'get_anime_details',
  'Get full details for an anime by MAL ID',
  { mal_id: z.number().describe('MyAnimeList ID') },
  async ({ mal_id }) => {
    const details = await getAnimeDetails(mal_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(details, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
