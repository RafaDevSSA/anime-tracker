# Skill Contracts Spec — AnimeTracker

## Interface unificada

Toda skill expõe uma função `run(input)` e um `SKILL.md` descritivo:

```ts
export function run(input: SkillInput): Promise<SkillOutput> | SkillOutput
```

---

## 1. anime-search-skill

**Arquivo:** `skills/anime-search-skill/index.ts`  
**MCP dependente:** `anime-search-mcp` (localhost:3001)

### Input
```ts
interface AnimeSearchInput {
  name: string; // nome parcial ou completo
}
```

### Output
```ts
interface AnimeSearchOutput {
  best: AnimeCandidate & { confidence: number }; // 0–1
  candidates: AnimeCandidate[];
}
```

### Comportamento
- Chama `POST http://localhost:3001/call` com `{ tool: "search_anime", params: { name } }`
- Ordena por `score` decrescente
- `confidence = score / 10` (normalizado 0–1, máximo 1.0)
- Lança erro se `candidates.length === 0`

### Exemplo
```ts
import { run } from './skills/anime-search-skill';

const result = await run({ name: 'Naruto' });
// {
//   best: { mal_id: 20, name: 'Naruto', confidence: 0.79, ... },
//   candidates: [ ... ]
// }
```

### Testes de contrato
```ts
// ✅ deve retornar candidates com mal_id e confidence
// ✅ deve ordenar por score decrescente
// ✅ deve lançar erro quando lista vazia
// ✅ deve normalizar confidence para máximo 1.0
```

---

## 2. episode-check-skill

**Arquivo:** `skills/episode-check-skill/index.ts`  
**MCP dependente:** `schedule-scraper-mcp` (localhost:3002)  
**DB dependente:** `AnimeRepository`, `EpisodeRepository`

### Input
```ts
interface EpisodeCheckInput {
  mal_ids: number[];
}
```

### Output
```ts
interface EpisodeCheckOutput {
  episodes: TodayEpisode[];
  persisted: number; // quantidade salva no SQLite
}
```

### Comportamento
- Chama `POST http://localhost:3002/call` com `{ tool: "get_today_episodes", params: { mal_ids } }`
- Para cada episódio retornado: busca anime por `mal_id` no SQLite e faz upsert em `episodes`
- `persisted` conta apenas episódios cujo anime existe no banco local
- Episódios de mal_ids não cadastrados são ignorados silenciosamente

### Exemplo
```ts
import { run } from './skills/episode-check-skill';

const result = await run({ mal_ids: [20, 38691] });
// { episodes: [{ mal_id: 38691, ep_num: 5, title: 'Dr. Stone', ... }], persisted: 1 }
```

### Testes de contrato
```ts
// ✅ deve persistir episódios de animes cadastrados
// ✅ deve ignorar mal_ids sem correspondência no SQLite
// ✅ deve retornar persisted=0 quando lista vazia
```

---

## 3. notification-build-skill

**Arquivo:** `skills/notification-build-skill/index.ts`  
**Dependências:** nenhuma (função pura)

### Input
```ts
interface NotificationBuildInput {
  episodes: TodayEpisode[];
}
```

### Output
```ts
interface NotificationPayload {
  title: string;
  body:  string;
  data:  { mal_ids: number[]; date: string };
}
```

### Comportamento
- Função **síncrona** — sem I/O
- Lança erro se `episodes.length === 0`
- Título singular/plural: `"1 anime novo hoje!"` / `"N animes novos hoje!"`
- Body: `linhas.join('\n')` onde cada linha = `"${ep.title} ep ${ep.ep_num}"`
- `data.date` = ISO date local: `new Date().toISOString().split('T')[0]`

### Exemplo
```ts
import { run } from './skills/notification-build-skill';

const payload = run({ episodes: [
  { mal_id: 20, ep_num: 221, title: 'Naruto', air_time: '19:00' },
  { mal_id: 38691, ep_num: 15, title: 'Dr. Stone', air_time: '23:00' },
]});
// {
//   title: "2 animes novos hoje!",
//   body: "Naruto ep 221\nDr. Stone ep 15",
//   data: { mal_ids: [20, 38691], date: "2026-06-06" }
// }
```

### Testes de contrato
```ts
// ✅ deve usar título singular para 1 episódio
// ✅ deve usar título plural para N episódios
// ✅ deve lançar erro para lista vazia
// ✅ deve incluir todos os mal_ids em data
```

---

## 4. sqlite-crud-skill

**Arquivo:** `skills/sqlite-crud-skill/index.ts`  
**Dependências:** `AnimeRepository`, `EpisodeRepository`

### Input
```ts
interface SqliteCrudInput {
  operation: 'insertAnime' | 'findAllAnimes' | 'findAnimeById' | 'deleteAnime' | 'upsertEpisode' | 'getTodayEpisodes';
  payload?: Record<string, unknown>;
}
```

### Output por operação

| operation | payload | retorno |
|---|---|---|
| `insertAnime` | `Omit<Anime, 'id'\|'created_at'>` | `{ id: number }` |
| `findAllAnimes` | — | `Anime[]` |
| `findAnimeById` | `{ id: number }` | `Anime \| null` |
| `deleteAnime` | `{ id: number }` | `{ deleted: true }` |
| `upsertEpisode` | `Omit<Episode, 'id'\|'fetched_at'>` | `{ ok: true }` |
| `getTodayEpisodes` | — | `Episode[]` |

### Exemplo
```ts
import { run } from './skills/sqlite-crud-skill';

// Inserir anime
const { id } = await run({
  operation: 'insertAnime',
  payload: { name: 'Naruto', mal_id: 20, anilist_id: null, cover_url: '...', status: 'completed' }
}) as { id: number };

// Buscar todos
const animes = await run({ operation: 'findAllAnimes' }) as Anime[];

// Deletar
await run({ operation: 'deleteAnime', payload: { id } });
```

### Testes de contrato
```ts
// ✅ insertAnime deve retornar id numérico
// ✅ findAllAnimes deve retornar array (vazio se nenhum cadastrado)
// ✅ deleteAnime deve remover anime e seus episódios (CASCADE)
// ✅ operação desconhecida deve lançar erro descritivo
```
