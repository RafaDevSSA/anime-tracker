---
name: notification-build-skill
description: >
  Use esta skill após a lista de episódios do dia ser gerada pelo
  episode-check-skill. Monta o payload de push notification agrupado por anime.
  Triggers: "montar notificação", lista de episódios do dia disponível.
  Não usar quando: lista de episódios estiver vazia.
---

## Inputs
- episodes: TodayEpisode[] — episódios do dia com mal_id, ep_num, title

## Outputs
- title: string — título da notificação
- body: string — corpo com lista de animes
- data: object — payload extra para deep link

## Exemplo de uso
```ts
const payload = await notificationBuildSkill.run({ episodes: [...] });
// => { title: '3 animes hoje!', body: 'Naruto ep 221\nOne Piece ep 1001', data: {...} }
```
