import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './OrganizationService';
import { IHttpClient, init } from '../lib/http-client';

describe('OrganizationService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  describe('search', () => {
    it('should call client.post with correct url and payload', async () => {
      const service = new OrganizationService();
      const request = { filters: { slug: 'sunbird', isTenant: true } };

      await service.search(request);

      expect(mockClient.post).toHaveBeenCalledWith('/org/v2/search', { request });
    });

    it('should return organization data with channel ID', async () => {
      const service = new OrganizationService();
      const mockResponse = {
        data: {
          result: {
            response: {
              content: [
                {
                  identifier: 'org-123',
                  channel: 'channel-456',
                  slug: 'sunbird',
                },
              ],
            },
          },
        },
        status: 200,
        headers: {},
      };

      (mockClient.post as any).mockResolvedValue(mockResponse);

      const result = await service.search({ filters: { slug: 'sunbird', isTenant: true } });

      expect(result.data.result.response.content[0].channel).toBe('channel-456');
    });
  });
});
