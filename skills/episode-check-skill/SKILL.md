---
name: episode-check-skill
description: >
  Use esta skill quando o job diário disparar às 8h ou quando o usuário
  abrir a home screen. Consulta o schedule-scraper-mcp para todos os animes
  da biblioteca local e persiste os episódios de hoje no SQLite.
  Triggers: "verificar episódios do dia", "job diário", abertura da home.
  Não usar quando: verificação foi feita há menos de 6h (cache MCP ativo).
---

## Inputs
- mal_ids: number[] — IDs MAL de todos os animes cadastrados

## Outputs
- episodes: TodayEpisode[] — episódios encontrados para hoje
- persisted: number — quantidade de episódios persistidos no SQLite

## Exemplo de uso
```ts
const result = await episodeCheckSkill.run({ mal_ids: [20, 1535, 21] });
// => { episodes: [...], persisted: 3 }
```
