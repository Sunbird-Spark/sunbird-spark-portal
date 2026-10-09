import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnrichmentObjectService } from './EnrichmentObjectService';
import { IHttpClient, init } from '../lib/http-client';

const transcript = (identifier: string) => ({
  identifier,
  enrichmentObjectType: 'Transcript',
  parentId: 'do_1',
  status: 'Live',
});

describe('EnrichmentObjectService', () => {
  let mockClient: IHttpClient;
  let service: EnrichmentObjectService;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
    service = new EnrichmentObjectService();
  });

  describe('list', () => {
    it('posts parentId and the type under request.enrichmentObject and returns enrichmentObjects', async () => {
      mockClient.post = vi.fn().mockResolvedValue({ data: { enrichmentObjects: [transcript('t1')], count: 1 }, status: 200, headers: {} });
      const result = await service.list('do_1', 'Transcript');
      expect(mockClient.post).toHaveBeenCalledWith('/object/enrichment/v4/list', {
        request: { enrichmentObject: { parentId: 'do_1', enrichmentObjectType: 'Transcript' } },
      });
      expect(result).toEqual([transcript('t1')]);
    });

    it('omits enrichmentObjectType when none is given', async () => {
      mockClient.post = vi.fn().mockResolvedValue({ data: { enrichmentObjects: [] }, status: 200, headers: {} });
      await service.list('do_1');
      expect(mockClient.post).toHaveBeenCalledWith('/object/enrichment/v4/list', {
        request: { enrichmentObject: { parentId: 'do_1' } },
      });
    });

    it('returns [] when enrichmentObjects is missing (negative)', async () => {
      mockClient.post = vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} });
      expect(await service.list('do_1', 'Transcript')).toEqual([]);
    });

    it('returns [] when the response has no data (negative)', async () => {
      mockClient.post = vi.fn().mockResolvedValue({ status: 200, headers: {} });
      expect(await service.list('do_1', 'Transcript')).toEqual([]);
    });

    it('propagates an HTTP error (negative)', async () => {
      mockClient.post = vi.fn().mockRejectedValue(new Error('boom'));
      await expect(service.list('do_1', 'Transcript')).rejects.toThrow('boom');
    });
  });

  describe('listForTypes', () => {
    it('makes one call per type and concatenates the results in type order', async () => {
      mockClient.post = vi.fn().mockImplementation((_url: string, body: { request: { enrichmentObject: { enrichmentObjectType: string } } }) => {
        const type = body.request.enrichmentObject.enrichmentObjectType;
        return Promise.resolve({ data: { enrichmentObjects: [{ ...transcript(`${type}-1`), enrichmentObjectType: type }] }, status: 200, headers: {} });
      });
      const result = await service.listForTypes('do_1', ['Transcript', 'Summary']);
      expect(mockClient.post).toHaveBeenCalledTimes(2);
      expect(result.map((o) => o.identifier)).toEqual(['Transcript-1', 'Summary-1']);
    });

    it('makes no call and returns [] for an empty type list (negative)', async () => {
      mockClient.post = vi.fn();
      expect(await service.listForTypes('do_1', [])).toEqual([]);
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });
});
