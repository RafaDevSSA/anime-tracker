import express from 'express';
import { getTodayEpisodes } from './tools/getTodayEpisodes';
import { getWeekSchedule } from './tools/getWeekSchedule';

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.options('/{*path}', (_req, res) => res.sendStatus(204));

const tools: Record<string, (params: any) => Promise<unknown>> = {
  get_today_episodes: ({ mal_ids }: { mal_ids: number[] }) => getTodayEpisodes(mal_ids),
  get_week_schedule: ({ mal_id }: { mal_id: number }) => getWeekSchedule(mal_id),
};

app.post('/call', async (req, res) => {
  const { tool, params } = req.body ?? {};

  if (!tool || !(tool in tools)) {
    res.status(400).json({ error: `Tool "${tool}" not found. Available: ${Object.keys(tools).join(', ')}` });
    return;
  }

  try {
    const result = await tools[tool](params ?? {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', mcp: 'schedule-scraper-mcp' }));

const PORT = Number(process.env.PORT ?? 3002);
app.listen(PORT, () => console.log(`schedule-scraper-mcp HTTP server running on http://localhost:${PORT}`));
