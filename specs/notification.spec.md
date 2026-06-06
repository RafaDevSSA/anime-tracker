# Notification Spec — AnimeTracker

## 1. Visão geral

O sistema de notificações consiste em três camadas:

```
BackgroundFetch (Expo) → ScheduleService → NotificationService
                              ↓
                      EpisodeRepository (SQLite)
```

---

## 2. Agendamento do background task

### Configuração (`BackgroundTaskService.ts`)

```ts
await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
  minimumInterval: 8 * 60 * 60, // 8 horas em segundos
  stopOnTerminate: false,        // mantém ativo após fechar o app
  startOnBoot: true,             // retoma após reiniciar o dispositivo
});
```

### Nome da task
```ts
const BACKGROUND_FETCH_TASK = 'anime-episode-check';
```

### Ciclo de execução
1. Sistema operacional dispara a task no intervalo mínimo de 8h
2. Task chama `ScheduleService.refreshTodayEpisodes()`
3. Se houver episódios → `NotificationService.scheduleToday(episodes)`
4. Retorna `BackgroundFetchResult.NewData` (sucesso) ou `Failed` (erro)

> **Nota iOS:** o iOS não garante o intervalo exato — pode atrasar ou agrupar execuções. Não depender de horário preciso.

---

## 3. Janela de silêncio noturno

**Horário silencioso: 22h00 – 08h00 (horário local do dispositivo)**

A lógica de silêncio deve ser aplicada em `NotificationService.scheduleToday()`:

```ts
function isQuietHour(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 8;
}

// Se estiver em janela silenciosa, agenda para às 8h do próximo dia útil
async function scheduleToday(episodes: TodayEpisode[]): Promise<void> {
  if (episodes.length === 0) return;

  const trigger = isQuietHour()
    ? { type: 'daily', hour: 8, minute: 0 } as DailyTrigger
    : null; // disparo imediato

  await Notifications.scheduleNotificationAsync({ content, trigger });
}
```

**Configurável pelo usuário (Sprint 4):** o horário de início/fim do silêncio será exposto em Settings.

---

## 4. Agrupamento de notificações

Múltiplos episódios no mesmo dia são agrupados em **uma única notificação**:

```ts
// 1 episódio
{ title: "1 anime novo hoje!", body: "Dr. Stone ep 15" }

// N episódios
{ title: "3 animes novos hoje!", body: "Dr. Stone ep 15\nOne Piece ep 1101\nNaruto ep 221" }
```

### Regras de agrupamento
- Máximo de **5 animes** listados no corpo da notificação
- Se houver mais de 5: `"Dr. Stone ep 15\n+2 outros animes"`
- Ordenação: alfabética por nome do anime

### Implementado em
`skills/notification-build-skill/index.ts` — função `run()`

---

## 5. Permissões

Permissão é solicitada na inicialização do app (`app/_layout.tsx`):

```ts
NotificationService.requestPermissions().then((granted) => {
  if (granted) BackgroundTaskService.register();
});
```

Se a permissão for negada:
- Background task **não é registrada**
- App funciona normalmente sem notificações
- Não exibir banner pedindo permissão novamente na mesma sessão

---

## 6. Configuração do handler

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

Badge desabilitado — sem contador vermelho no ícone do app.

---

## 7. Payload de deep link

O campo `data` da notificação permite navegar para a tela correta ao tocar:

```ts
data: {
  mal_ids: number[];  // IDs dos animes com episódio hoje
  date: string;       // "2026-06-06" — para filtrar no SQLite
}
```

O listener de notificação (a implementar em Sprint 4) deve redirecionar para `/(tabs)/index` (Home).

---

## 8. Estados do background fetch

| Status | Significado | Ação |
|---|---|---|
| `Available` | Task pode ser registrada | Registrar normalmente |
| `Restricted` | Restrição do SO (parental control, MDM) | Não registrar, não exibir erro |
| `Denied` | Usuário desativou background refresh | Não registrar, não exibir erro |
| `undefined` / erro | Plataforma não suporta (web) | Ignorar silenciosamente |
