import { searchAnime } from '../searchAnime';
import * as jikan from '../../adapters/jikan.adapter';
import * as anilist from '../../adapters/anilist.adapter';

jest.mock('../../adapters/jikan.adapter');
jest.mock('../../adapters/anilist.adapter');

const mockJikanResults = [
  { mal_id: 20, name: 'Naruto', cover_url: 'http://img.test/1.jpg', status: 'completed' as const, score: 7.9 },
];
const mockAnilistResults = [
  { mal_id: 20, name: 'Naruto', cover_url: 'http://img.test/1.jpg', status: 'completed' as const, score: 7.9 },
];

describe('searchAnime tool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns jikan results when successful', async () => {
    (jikan.searchAnime as jest.Mock).mockResolvedValue(mockJikanResults);
    const results = await searchAnime('Naruto');
    expect(results).toEqual(mockJikanResults);
    expect(anilist.searchAnime).not.toHaveBeenCalled();
  });

  it('falls back to anilist on jikan 429', async () => {
    const rateLimitErr = Object.assign(new Error('Rate limited'), { status: 429 });
    (jikan.searchAnime as jest.Mock).mockRejectedValue(rateLimitErr);
    (anilist.searchAnime as jest.Mock).mockResolvedValue(mockAnilistResults);

    const results = await searchAnime('Naruto');
    expect(results).toEqual(mockAnilistResults);
    expect(anilist.searchAnime).toHaveBeenCalledWith('Naruto');
  });

  it('throws non-429 jikan errors', async () => {
    (jikan.searchAnime as jest.Mock).mockRejectedValue(new Error('Server error'));
    await expect(searchAnime('Naruto')).rejects.toThrow('Server error');
    expect(anilist.searchAnime).not.toHaveBeenCalled();
  });
});
