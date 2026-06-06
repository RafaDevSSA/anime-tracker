# MCP Anime Spec — AnimeTracker

## 1. anime-search-mcp

**Transporte:** stdio (agentes Claude) + HTTP `POST /call` (app web, porta 3001)  
**Arquivo principal:** `mcps/anime-search-mcp/src/server.ts`

### 1.1 Tool: `search_anime`

Busca animes por nome retornando uma lista de candidatos ordenados por relevância.

#### Input
```ts
{ name: string }  // nome parcial ou completo do anime
```

#### Output
```ts
AnimeCandidate[]

interface AnimeCandidate {
  mal_id:    number;       // MyAnimeList ID
  name:      string;       // título oficial
  cover_url: string | null;
  status:    'airing' | 'completed' | 'unknown';
  score:     number | null; // 0–10
}
```

#### Erros esperados
| Código | Causa | Comportamento |
|---|---|---|
| 429 | Jikan rate limit (>3 req/s) | Aguarda 1s e faz fallback para AniList |
| 500 | Jikan indisponível | Tenta AniList diretamente |
| 400 | `name` vazio ou ausente | Retorna `{ error: "Tool ... not found" }` |

#### Exemplo
```bash
curl -X POST http://localhost:3001/call \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_anime","params":{"name":"Dr Stone"}}'

# Resposta
[
  { "mal_id": 38691, "name": "Dr. Stone", "cover_url": "...", "status": "completed", "score": 8.26 },
  { "mal_id": 55644, "name": "Dr. Stone: New World Part 2", ... }
]
```

---

### 1.2 Tool: `get_anime_details`

Retorna detalhes completos de um anime incluindo horário de exibição semanal.

#### Input
```ts
{ mal_id: number }
```

#### Output
```ts
AnimeDetail

interface AnimeDetail {
  mal_id:          number;
  name:            string;
  synopsis:        string | null;
  cover_url:       string | null;
  total_episodes:  number | null;
  status:          'airing' | 'completed' | 'unknown';
  schedule:        WeekSchedule | null;
}

interface WeekSchedule {
  day_of_week: string;        // ex: "Sundays"
  air_time:    string | null; // ex: "23:00"
  timezone:    string | null; // ex: "Asia/Tokyo"
}
```

#### Erros esperados
| Código | Causa | Comportamento |
|---|---|---|
| 429 | Rate limit | Fallback AniList (sem schedule — AniList não tem broadcast detalhado) |
| 404 | mal_id inválido | Propaga erro ao caller |

---

### 1.3 Rate limits e throttle

| API | Limite | Estratégia |
|---|---|---|
| Jikan (MAL) | 3 req/s, 60/min | Fallback para AniList em 429 após 1s |
| AniList GraphQL | 90 req/min | Sem throttle interno — monitorar 429 |

O `mcp.config.json` declara `rateLimit.requestsPerSecond: 2` como intenção de throttle para agentes.
A implementação atual não aplica delay automático entre chamadas — adicionar se necessário.

---

## 2. schedule-scraper-mcp

**Transporte:** stdio (agentes Claude) + HTTP `POST /call` (app web, porta 3002)  
**Arquivo principal:** `mcps/schedule-scraper-mcp/src/server.ts`

### 2.1 Tool: `get_today_episodes`

Verifica quais animes de uma lista têm episódio hoje, comparando o `broadcast.day` da Jikan com o dia atual.

#### Input
```ts
{ mal_ids: number[] }
```

#### Output
```ts
TodayEpisode[]

interface TodayEpisode {
  mal_id:   number;
  ep_num:   number;
  title:    string;
  air_time: string | null;
}
```

#### Cache
- TTL: **6 horas** por `mal_id`
- Chave: `today:{mal_id}`
- Armazenamento: `Map` em memória — resetado ao reiniciar o processo
- `null` também é cacheado (ausência de episódio hoje = dado válido)

#### Comportamento esperado
```ts
// Primeira chamada — hit na API Jikan
await getTodayEpisodes([38691]) // → [{ mal_id: 38691, ep_num: 5, title: "Dr. Stone", ... }]

// Segunda chamada em < 6h — cache hit, zero requests
await getTodayEpisodes([38691]) // → mesma resposta, fetch não é chamado
```

---

### 2.2 Tool: `get_week_schedule`

Retorna o horário semanal de um anime específico.

#### Input
```ts
{ mal_id: number }
```

#### Output
```ts
WeekSchedule | null

interface WeekSchedule {
  day_of_week: string;
  air_time:    string | null;
  timezone:    string | null;
}
```

#### Cache
- TTL: **6 horas**
- Chave: `week:{mal_id}`

---

## 3. Endpoints HTTP comuns

Ambos os MCPs expõem:

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/call` | Executa uma tool pelo nome |
| `GET` | `/health` | Health check |
| `OPTIONS` | `/{*path}` | CORS preflight |

### Headers CORS
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Formato do body `/call`
```ts
{ tool: string; params: Record<string, unknown> }
```

### Resposta de erro
```ts
{ error: string }  // status 400 (tool não existe) ou 500 (erro interno)
```
