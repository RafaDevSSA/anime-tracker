import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getTodayEpisodes } from './tools/getTodayEpisodes';
import { getWeekSchedule } from './tools/getWeekSchedule';

const server = new McpServer({
  name: 'schedule-scraper-mcp',
  version: '1.0.0',
});

server.tool(
  'get_today_episodes',
  'Get anime episodes airing today for a list of MAL IDs (cached 6h)',
  { mal_ids: z.array(z.number()).describe('List of MyAnimeList IDs') },
  async ({ mal_ids }) => {
    const episodes = await getTodayEpisodes(mal_ids);
    return {
      content: [{ type: 'text', text: JSON.stringify(episodes, null, 2) }],
    };
  }
);

server.tool(
  'get_week_schedule',
  'Get weekly broadcast schedule for an anime by MAL ID (cached 6h)',
  { mal_id: z.number().describe('MyAnimeList ID') },
  async ({ mal_id }) => {
    const schedule = await getWeekSchedule(mal_id);
    return {
      content: [{ type: 'text', text: JSON.stringify(schedule, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
