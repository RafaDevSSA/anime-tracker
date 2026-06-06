import { AnimeService } from '../AnimeService';
import { AnimeRepository } from '../../db/AnimeRepository';

jest.mock('../../db/AnimeRepository');
global.fetch = jest.fn();

const mockCandidate = {
  mal_id: 20,
  name: 'Naruto',
  cover_url: 'http://img.test/naruto.jpg',
  status: 'completed' as const,
  score: 7.9,
};

const mockAnime = {
  id: 1,
  name: 'Naruto',
  mal_id: 20,
  anilist_id: null,
  cover_url: 'http://img.test/naruto.jpg',
  status: 'completed' as const,
  created_at: '2026-06-06T00:00:00.000Z',
};

describe('AnimeService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('searchByName', () => {
    it('retorna candidatos do MCP', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [mockCandidate],
      });

      const result = await AnimeService.searchByName('Naruto');
      expect(result).toEqual([mockCandidate]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/call'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('lança erro quando MCP retorna status não-ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });
      await expect(AnimeService.searchByName('Naruto')).rejects.toThrow('Falha ao buscar anime');
    });
  });

  describe('addToLibrary', () => {
    it('insere anime novo e retorna id', async () => {
      (AnimeRepository.findByMalId as jest.Mock).mockResolvedValue(null);
      (AnimeRepository.insert as jest.Mock).mockResolvedValue(42);

      const id = await AnimeService.addToLibrary(mockCandidate);
      expect(id).toBe(42);
      expect(AnimeRepository.insert).toHaveBeenCalledWith({
        name: 'Naruto',
        mal_id: 20,
        anilist_id: null,
        cover_url: mockCandidate.cover_url,
        status: 'completed',
      });
    });

    it('retorna id existente sem inserir duplicata', async () => {
      (AnimeRepository.findByMalId as jest.Mock).mockResolvedValue(mockAnime);

      const id = await AnimeService.addToLibrary(mockCandidate);
      expect(id).toBe(1);
      expect(AnimeRepository.insert).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('delega para AnimeRepository.findAll', async () => {
      (AnimeRepository.findAll as jest.Mock).mockResolvedValue([mockAnime]);
      const result = await AnimeService.getAll();
      expect(result).toEqual([mockAnime]);
    });
  });

  describe('remove', () => {
    it('delega para AnimeRepository.delete', async () => {
      (AnimeRepository.delete as jest.Mock).mockResolvedValue(undefined);
      await AnimeService.remove(1);
      expect(AnimeRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
