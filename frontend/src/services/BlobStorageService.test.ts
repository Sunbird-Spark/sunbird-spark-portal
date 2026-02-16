import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlobStorageService } from './BlobStorageService';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('BlobStorageService', () => {
  let blobStorageService: BlobStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    blobStorageService = new BlobStorageService();
  });

  describe('fetchJson', () => {
    it('should fetch and return JSON data', async () => {
      const mockData = { key: 'value', items: [1, 2, 3] };
      const url = 'https://example.com/data.json';

      vi.mocked(axios.get).mockResolvedValue({
        data: mockData,
      });

      const result = await blobStorageService.fetchJson(url);

      expect(result).toEqual(mockData);
      expect(axios.get).toHaveBeenCalledWith(url);
    });

    it('should throw error when fetch fails', async () => {
      const url = 'https://example.com/data.json';

      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

      await expect(blobStorageService.fetchJson(url)).rejects.toThrow('Network error');
    });

    it('should handle complex JSON structures', async () => {
      const mockData = {
        nested: {
          array: [{ id: 1 }, { id: 2 }],
          object: { prop: 'value' },
        },
      };
      const url = 'https://example.com/complex.json';

      vi.mocked(axios.get).mockResolvedValue({
        data: mockData,
      });

      const result = await blobStorageService.fetchJson(url);

      expect(result).toEqual(mockData);
    });
  });

  describe('fetchJsonWithFallback', () => {
    it('should return data from primary URL when successful', async () => {
      const mockData = { primary: true };
      const primaryUrl = 'https://example.com/primary.json';
      const fallbackUrl = 'https://example.com/fallback.json';

      vi.mocked(axios.get).mockResolvedValue({
        data: mockData,
      });

      const result = await blobStorageService.fetchJsonWithFallback(primaryUrl, fallbackUrl);

      expect(result).toEqual(mockData);
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(primaryUrl);
    });

    it('should fallback to secondary URL when primary fails', async () => {
      const mockFallbackData = { fallback: true };
      const primaryUrl = 'https://example.com/primary.json';
      const fallbackUrl = 'https://example.com/fallback.json';

      vi.mocked(axios.get)
        .mockRejectedValueOnce(new Error('404'))
        .mockResolvedValueOnce({
          data: mockFallbackData,
        });

      const result = await blobStorageService.fetchJsonWithFallback(primaryUrl, fallbackUrl);

      expect(result).toEqual(mockFallbackData);
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(axios.get).toHaveBeenCalledWith(primaryUrl);
      expect(axios.get).toHaveBeenCalledWith(fallbackUrl);
    });

    it('should return null when both URLs fail', async () => {
      const primaryUrl = 'https://example.com/primary.json';
      const fallbackUrl = 'https://example.com/fallback.json';

      vi.mocked(axios.get)
        .mockRejectedValueOnce(new Error('404'))
        .mockRejectedValueOnce(new Error('404'));

      const result = await blobStorageService.fetchJsonWithFallback(primaryUrl, fallbackUrl);

      expect(result).toBeNull();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchText', () => {
    it('should fetch and return text content', async () => {
      const mockText = 'This is plain text content';
      const url = 'https://example.com/file.txt';

      vi.mocked(axios.get).mockResolvedValue({
        data: mockText,
      });

      const result = await blobStorageService.fetchText(url);

      expect(result).toBe(mockText);
      expect(axios.get).toHaveBeenCalledWith(url, {
        responseType: 'text',
      });
    });

    it('should throw error when text fetch fails', async () => {
      const url = 'https://example.com/file.txt';

      vi.mocked(axios.get).mockRejectedValue(new Error('Not found'));

      await expect(blobStorageService.fetchText(url)).rejects.toThrow('Not found');
    });
  });

  describe('fetchBlob', () => {
    it('should fetch and return blob data', async () => {
      const mockBlob = new Blob(['binary data'], { type: 'application/octet-stream' });
      const url = 'https://example.com/file.bin';

      vi.mocked(axios.get).mockResolvedValue({
        data: mockBlob,
      });

      const result = await blobStorageService.fetchBlob(url);

      expect(result).toBe(mockBlob);
      expect(axios.get).toHaveBeenCalledWith(url, {
        responseType: 'blob',
      });
    });

    it('should throw error when blob fetch fails', async () => {
      const url = 'https://example.com/file.bin';

      vi.mocked(axios.get).mockRejectedValue(new Error('Download failed'));

      await expect(blobStorageService.fetchBlob(url)).rejects.toThrow('Download failed');
    });
  });

  describe('buildLanguageUrl', () => {
    it('should construct URL with default json extension', () => {
      const baseUrl = 'https://example.com/storage';
      const fileName = 'faq';
      const languageCode = 'en';

      const result = blobStorageService.buildLanguageUrl(baseUrl, fileName, languageCode);

      expect(result).toBe('https://example.com/storage/faq-en.json');
    });

    it('should construct URL with custom extension', () => {
      const baseUrl = 'https://example.com/storage';
      const fileName = 'document';
      const languageCode = 'es';
      const extension = 'xml';

      const result = blobStorageService.buildLanguageUrl(
        baseUrl,
        fileName,
        languageCode,
        extension
      );

      expect(result).toBe('https://example.com/storage/document-es.xml');
    });

    it('should handle different language codes', () => {
      const baseUrl = 'https://example.com/storage';
      const fileName = 'content';

      expect(blobStorageService.buildLanguageUrl(baseUrl, fileName, 'en')).toBe(
        'https://example.com/storage/content-en.json'
      );
      expect(blobStorageService.buildLanguageUrl(baseUrl, fileName, 'fr')).toBe(
        'https://example.com/storage/content-fr.json'
      );
      expect(blobStorageService.buildLanguageUrl(baseUrl, fileName, 'zh-CN')).toBe(
        'https://example.com/storage/content-zh-CN.json'
      );
    });

    it('should handle base URLs with trailing slash', () => {
      const baseUrl = 'https://example.com/storage/';
      const fileName = 'faq';
      const languageCode = 'en';

      const result = blobStorageService.buildLanguageUrl(baseUrl, fileName, languageCode);

      expect(result).toBe('https://example.com/storage//faq-en.json');
    });
  });
});
