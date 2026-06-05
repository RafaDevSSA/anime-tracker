---
name: sqlite-crud-skill
description: >
  Use esta skill para qualquer operação de persistência no SQLite local.
  Abstrai AnimeRepository e EpisodeRepository com interface unificada.
  Triggers: "salvar anime", "buscar do banco", "persistir episódio".
  Não usar quando: apenas leitura de memória ou cache.
---

## Inputs
- operation: 'insertAnime' | 'findAllAnimes' | 'upsertEpisode' | 'getTodayEpisodes'
- payload: object — dados específicos da operação

## Outputs
- result: object | array — resultado da operação

## Exemplo de uso
```ts
const result = await sqliteCrudSkill.run({
  operation: 'insertAnime',
  payload: { name: 'Naruto', mal_id: 20, status: 'completed', cover_url: '...', anilist_id: null }
});
// => { id: 1 }
```
