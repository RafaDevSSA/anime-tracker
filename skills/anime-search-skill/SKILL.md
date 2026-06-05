---
name: anime-search-skill
description: >
  Use esta skill quando o usuário digitar o nome de um anime para cadastrar,
  ou quando um agente precisar identificar um anime por nome.
  Triggers: "cadastrar anime", "buscar anime", "encontrar anime".
  Não usar quando: o anime já está cadastrado no SQLite local.
---

## Inputs
- name: string — nome do anime a buscar

## Outputs
- candidates: AnimeCandidate[] — lista de candidatos com score de confiança
- best: AnimeCandidate — melhor match (score mais alto)

## Exemplo de uso
```ts
const result = await animeSearchSkill.run({ name: 'Naruto' });
// => { best: { mal_id: 20, name: 'Naruto', confidence: 0.98 }, candidates: [...] }
```
