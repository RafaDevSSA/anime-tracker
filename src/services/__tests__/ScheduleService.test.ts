import { ScheduleService } from '../ScheduleService';
import { AnimeRepository } from '../../db/AnimeRepository';
import { EpisodeRepository } from '../../db/EpisodeRepository';

jest.mock('../../db/AnimeRepository');
jest.mock('../../db/EpisodeRepository');
global.fetch = jest.fn();

const mockAnime = {
  id: 1, name: 'Dr. Stone', mal_id: 38691, anilist_id: null,
  cover_url: null, status: 'airing' as const, created_at: '2026-06-06',
};

const mockTodayEpisode = {
  mal_id: 38691, ep_num: 15, title: 'Dr. Stone', air_time: '23:00',
};

describe('ScheduleService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('refreshTodayEpisodes', () => {
    it('retorna lista vazia quando não há animes cadastrados', async () => {
      (AnimeRepository.getAllMalIds as jest.Mock).mockResolvedValue([]);
      const result = await ScheduleService.refreshTodayEpisodes();
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('busca episódios no MCP e persiste no SQLite', async () => {
      (AnimeRepository.getAllMalIds as jest.Mock).mockResolvedValue([38691]);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockTodayEpisode],
      });
      (AnimeRepository.findByMalId as jest.Mock).mockResolvedValue(mockAnime);
      (EpisodeRepository.upsert as jest.Mock).mockResolvedValue(undefined);

      const result = await ScheduleService.refreshTodayEpisodes();

      expect(result).toEqual([mockTodayEpisode]);
      expect(EpisodeRepository.upsert).toHaveBeenCalledWith({
        anime_id: 1,
        episode_num: 15,
        air_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
    });

    it('ignora episódio quando anime não está cadastrado localmente', async () => {
      (AnimeRepository.getAllMalIds as jest.Mock).mockResolvedValue([38691]);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockTodayEpisode],
      });
      (AnimeRepository.findByMalId as jest.Mock).mockResolvedValue(null);

      await ScheduleService.refreshTodayEpisodes();
      expect(EpisodeRepository.upsert).not.toHaveBeenCalled();
    });

    it('lança erro quando MCP retorna status não-ok', async () => {
      (AnimeRepository.getAllMalIds as jest.Mock).mockResolvedValue([38691]);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
      await expect(ScheduleService.refreshTodayEpisodes()).rejects.toThrow('Falha ao buscar episódios');
    });
  });

  describe('getTodayFromDB', () => {
    it('delega para EpisodeRepository.findTodayAll', async () => {
      (EpisodeRepository.findTodayAll as jest.Mock).mockResolvedValue([]);
      const result = await ScheduleService.getTodayFromDB();
      expect(result).toEqual([]);
      expect(EpisodeRepository.findTodayAll).toHaveBeenCalled();
    });
  });
});
