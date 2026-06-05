import { episodeCache } from '../../cache/episodeCache';

describe('EpisodeCache', () => {
  it('returns undefined for missing keys (cache miss)', () => {
    expect(episodeCache.get('nonexistent-key-xyz')).toBeUndefined();
  });

  it('stores and retrieves values', () => {
    episodeCache.set('key1', { foo: 'bar' });
    expect(episodeCache.get('key1')).toEqual({ foo: 'bar' });
  });

  it('can store and retrieve null (cached absence)', () => {
    episodeCache.set('key-null', null);
    expect(episodeCache.get('key-null')).toBeNull();
  });

  it('returns undefined for expired entries', () => {
    jest.useFakeTimers();
    episodeCache.set('key2', 'value');
    jest.advanceTimersByTime(7 * 60 * 60 * 1000); // 7h — past TTL
    expect(episodeCache.get('key2')).toBeUndefined();
    jest.useRealTimers();
  });

  it('returns undefined after invalidate', () => {
    episodeCache.set('key3', 'value');
    episodeCache.invalidate('key3');
    expect(episodeCache.get('key3')).toBeUndefined();
  });
});
