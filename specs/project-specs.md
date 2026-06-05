anime-tracker/
├── app/                          # Expo Router — telas
│   ├── (tabs)/
│   │   ├── index.tsx             # Home: agenda do dia
│   │   ├── library.tsx           # Lista de animes cadastrados
│   │   └── add.tsx               # Cadastro de anime
│   └── anime/[id].tsx            # Detalhes do anime
│
├── src/
│   ├── services/                 # Business logic
│   │   ├── AnimeService.ts
│   │   ├── ScheduleService.ts
│   │   └── NotificationService.ts
│   ├── db/                       # Camada SQLite
│   │   ├── schema.ts             # DDL e migrations
│   │   ├── AnimeRepository.ts
│   │   └── EpisodeRepository.ts
│   ├── hooks/                    # React hooks customizados
│   │   ├── useAnimeList.ts
│   │   └── useTodaySchedule.ts
│   └── types/
│       └── index.ts
│
├── mcps/                         # Model Context Protocol servers
│   ├── anime-search-mcp/
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point MCP server
│   │   │   ├── tools/
│   │   │   │   ├── searchAnime.ts
│   │   │   │   └── getAnimeDetails.ts
│   │   │   └── adapters/
│   │   │       ├── jikan.adapter.ts
│   │   │       └── anilist.adapter.ts
│   │   ├── package.json
│   │   └── mcp.config.json
│   │
│   └── schedule-scraper-mcp/
│       ├── src/
│       │   ├── index.ts
│       │   ├── tools/
│       │   │   ├── getTodayEpisodes.ts
│       │   │   └── getWeekSchedule.ts
│       │   └── cache/
│       │       └── episodeCache.ts   # TTL cache para evitar rate limit
│       ├── package.json
│       └── mcp.config.json
│
├── skills/                       # Skills reutilizáveis por agentes
│   ├── anime-search-skill/
│   │   ├── SKILL.md              # Documentação e triggers
│   │   └── index.ts              # Implementação da skill
│   ├── episode-check-skill/
│   │   ├── SKILL.md
│   │   └── index.ts
│   ├── notification-build-skill/
│   │   ├── SKILL.md
│   │   └── index.ts
│   └── sqlite-crud-skill/
│       ├── SKILL.md
│       └── index.ts
│
├── specs/                        # Especificações técnicas
│   ├── project.spec.md           # Este documento
│   ├── sqlite.spec.md            # Schema, queries e migrations
│   ├── mcp-anime.spec.md         # Contrato dos MCPs
│   └── notification.spec.md      # Lógica de agendamento de push
│
├── .github/
│   └── workflows/
│       └── ci.yml
└── app.json