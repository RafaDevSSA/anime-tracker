const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class EpisodeCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /** Returns undefined = cache miss; null = cached absence; T = cached value */
  get<T>(key: string): T | null | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + TTL_MS });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }
}

export const episodeCache = new EpisodeCache();
