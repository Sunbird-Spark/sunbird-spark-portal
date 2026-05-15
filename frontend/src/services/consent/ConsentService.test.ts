import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentService } from './ConsentService';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('../../lib/http-client', () => ({
  getClient: () => ({ post: mockPost }),
}));

describe('ConsentService', () => {
  let service: ConsentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ConsentService();
  });

  describe('read', () => {
    it('posts to /user/v1/consent/read with the correct payload', async () => {
      const mockResponse = { data: { consents: [] } };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.read({
        userId: 'user-1',
        consumerId: 'channel-abc',
        objectId: 'collection-xyz',
      });

      expect(mockPost).toHaveBeenCalledWith('/user/v1/consent/read', {
        request: {
          consent: {
            filters: {
              userId: 'user-1',
              consumerId: 'channel-abc',
              objectId: 'collection-xyz',
            },
          },
        },
      });
      expect(result).toBe(mockResponse);
    });

    it('propagates errors from the HTTP client', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(
        service.read({ userId: 'u', consumerId: 'c', objectId: 'o' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('update', () => {
    it('posts to /user/v1/consent/update with the correct payload', async () => {
      const mockResponse = { data: { consent: { userId: 'user-1' } } };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.update({
        status: 'ACTIVE',
        userId: 'user-1',
        consumerId: 'channel-abc',
        objectId: 'collection-xyz',
        objectType: 'Collection',
      });

      expect(mockPost).toHaveBeenCalledWith('/user/v1/consent/update', {
        request: {
          consent: {
            status: 'ACTIVE',
            userId: 'user-1',
            consumerId: 'channel-abc',
            objectId: 'collection-xyz',
            objectType: 'Collection',
          },
        },
      });
      expect(result).toBe(mockResponse);
    });

    it('posts REVOKED status correctly', async () => {
      mockPost.mockResolvedValue({ data: {} });

      await service.update({
        status: 'REVOKED',
        userId: 'user-2',
        consumerId: 'ch-2',
        objectId: 'col-2',
        objectType: 'Collection',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/user/v1/consent/update',
        expect.objectContaining({
          request: expect.objectContaining({
            consent: expect.objectContaining({ status: 'REVOKED' }),
          }),
        })
      );
    });

    it('propagates errors from the HTTP client', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(
        service.update({ status: 'ACTIVE', userId: 'u', consumerId: 'c', objectId: 'o', objectType: 'Collection' })
      ).rejects.toThrow('Server error');
    });
  });
});
