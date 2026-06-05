import { getAnimeDetails } from '../getAnimeDetails';
import * as jikan from '../../adapters/jikan.adapter';
import * as anilist from '../../adapters/anilist.adapter';

jest.mock('../../adapters/jikan.adapter');
jest.mock('../../adapters/anilist.adapter');

const mockDetail = {
  mal_id: 20,
  name: 'Naruto',
  synopsis: 'A ninja story',
  cover_url: 'http://img.test/1.jpg',
  total_episodes: 220,
  status: 'completed',
  schedule: null,
};

describe('getAnimeDetails tool', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns jikan details when successful', async () => {
    (jikan.getAnimeDetails as jest.Mock).mockResolvedValue(mockDetail);
    const result = await getAnimeDetails(20);
    expect(result).toEqual(mockDetail);
    expect(anilist.getAnimeDetails).not.toHaveBeenCalled();
  });

  it('falls back to anilist on 429', async () => {
    const rateLimitErr = Object.assign(new Error('Rate limited'), { status: 429 });
    (jikan.getAnimeDetails as jest.Mock).mockRejectedValue(rateLimitErr);
    (anilist.getAnimeDetails as jest.Mock).mockResolvedValue(mockDetail);

    const result = await getAnimeDetails(20);
    expect(result).toEqual(mockDetail);
    expect(anilist.getAnimeDetails).toHaveBeenCalledWith(20);
  });
});
