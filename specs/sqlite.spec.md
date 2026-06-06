# SQLite Spec — AnimeTracker

## 1. Configuração e abertura do banco

O banco é aberto uma única vez via `getDatabase()` em `src/db/schema.ts`.
Usa WAL mode para melhor performance de leitura concorrente:

```ts
await db.execAsync('PRAGMA journal_mode = WAL;');
```

O banco fica em `animetracker.db` no diretório padrão do expo-sqlite.

---

## 2. Schema DDL completo

```sql
CREATE TABLE IF NOT EXISTS animes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  mal_id     INTEGER,                          -- MyAnimeList ID (nullable: anime sem ID externo)
  anilist_id INTEGER,                          -- AniList ID (fallback)
  cover_url  TEXT,
  status     TEXT DEFAULT 'airing'             -- airing | completed | unknown
             CHECK(status IN ('airing','completed','unknown')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS episodes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  anime_id    INTEGER NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
  episode_num INTEGER NOT NULL,
  air_date    DATE    NOT NULL,
  fetched_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(anime_id, episode_num)
);
```

---

## 3. Índices

```sql
CREATE INDEX IF NOT EXISTS idx_animes_mal_id       ON animes(mal_id);
CREATE INDEX IF NOT EXISTS idx_episodes_anime_id   ON episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_episodes_air_date   ON episodes(air_date);
```

**Justificativas:**
- `idx_animes_mal_id` — lookup frequente ao sincronizar episódios (findByMalId)
- `idx_episodes_anime_id` — JOIN/filter ao exibir episódios de um anime específico
- `idx_episodes_air_date` — query da Home: `WHERE date(air_date) = date('now')`

---

## 4. Queries padrão

### 4.1 Agenda do dia
```sql
SELECT e.*, a.name, a.cover_url
FROM episodes e
JOIN animes a ON a.id = e.anime_id
WHERE date(e.air_date) = date('now')
ORDER BY a.name ASC;
```

### 4.2 Todos os MAL IDs cadastrados
```sql
SELECT mal_id FROM animes WHERE mal_id IS NOT NULL;
```

### 4.3 Upsert de episódio (idempotente)
```sql
INSERT INTO episodes (anime_id, episode_num, air_date)
VALUES (?, ?, ?)
ON CONFLICT(anime_id, episode_num)
DO UPDATE SET air_date = excluded.air_date,
              fetched_at = CURRENT_TIMESTAMP;
```

### 4.4 Busca de anime por MAL ID
```sql
SELECT * FROM animes WHERE mal_id = ? LIMIT 1;
```

### 4.5 Todos os animes ordenados
```sql
SELECT * FROM animes ORDER BY name ASC;
```

---

## 5. Estratégia de migrations

As migrations são aplicadas via `runMigrations()` chamada dentro de `getDatabase()`,
garantindo execução na inicialização do app. Usam `CREATE TABLE IF NOT EXISTS` e
`CREATE INDEX IF NOT EXISTS` — safe para re-execução.

### Adicionando uma nova migration

1. Adicionar no final do bloco `db.execAsync` em `schema.ts`
2. Para mudanças destrutivas (ALTER TABLE, DROP COLUMN), usar:

```ts
// Verifica se coluna já existe antes de adicionar
const cols = await db.getAllAsync<{name:string}>("PRAGMA table_info(animes)");
if (!cols.find(c => c.name === 'nova_coluna')) {
  await db.execAsync("ALTER TABLE animes ADD COLUMN nova_coluna TEXT");
}
```

### Convenção de versão futura (quando necessário)

Para projetos com múltiplas versões em produção, criar tabela de controle:

```sql
CREATE TABLE IF NOT EXISTS migrations (
  version   INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

E executar cada migration condicionalmente via `SELECT COUNT(*) FROM migrations WHERE version = ?`.

---

## 6. Constraints e regras de integridade

| Constraint | Tabela | Motivo |
|---|---|---|
| `ON DELETE CASCADE` | episodes.anime_id | Ao remover anime, episódios são deletados automaticamente |
| `UNIQUE(anime_id, episode_num)` | episodes | Evita duplicata do mesmo episódio |
| `CHECK(status IN (...))` | animes.status | Garante valor válido no enum |
| `NOT NULL` em name | animes | Todo anime precisa de nome legível |

---

## 7. Transações

Upserts em batch (múltiplos episódios) devem usar `withTransactionAsync`:

```ts
await db.withTransactionAsync(async () => {
  for (const ep of episodes) {
    await db.runAsync('INSERT INTO episodes ...', [...]);
  }
});
```

Isso garante atomicidade e performance — uma transação é ~10x mais rápida que N inserts isolados.
