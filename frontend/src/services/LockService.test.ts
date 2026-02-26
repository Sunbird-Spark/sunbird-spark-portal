import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LockService } from './LockService';

const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock('../lib/http-client', () => ({
  getClient: () => ({
    post: mockPost,
    delete: mockDelete,
  }),
}));

describe('LockService', () => {
  let service: LockService;

  beforeEach(() => {
    service = new LockService();
    mockPost.mockReset();
    mockDelete.mockReset();
  });

  describe('createLock', () => {
    it('should call /lock/v1/create with correct payload', async () => {
      const lockResult = {
        lockKey: 'lock-key-123',
        expiresAt: '2026-02-20T11:00:00.000Z',
        expiresIn: 2,
      };
      mockPost.mockResolvedValue({ data: lockResult, status: 200, headers: {} });

      const request = {
        resourceId: 'do_123',
        resourceType: 'Content',
        resourceInfo: JSON.stringify({
          contentType: 'Course',
          identifier: 'do_123',
          mimeType: 'application/vnd.ekstep.content-collection',
        }),
        creatorInfo: JSON.stringify({ name: 'Test User', id: 'user-1' }),
        createdBy: 'user-1',
        isRootOrgAdmin: false,
      };

      const result = await service.createLock(request);

      expect(mockPost).toHaveBeenCalledWith('/lock/v1/create', {
        request,
      });
      expect(result.data).toEqual(lockResult);
    });

    it('should propagate errors from the API', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(
        service.createLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          resourceInfo: '{}',
          creatorInfo: '{}',
          createdBy: 'user-1',
        }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('retireLock', () => {
    it('should call /lock/v1/retire with correct payload', async () => {
      mockDelete.mockResolvedValue({ data: undefined, status: 200, headers: {} });

      await service.retireLock('do_123');

      expect(mockDelete).toHaveBeenCalledWith('/lock/v1/retire', {
        request: { resourceId: 'do_123', resourceType: 'Content' },
      });
    });

    it('should support custom resourceType', async () => {
      mockDelete.mockResolvedValue({ data: undefined, status: 200, headers: {} });

      await service.retireLock('do_456', 'Content');

      expect(mockDelete).toHaveBeenCalledWith('/lock/v1/retire', {
        request: { resourceId: 'do_456', resourceType: 'Content' },
      });
    });
  });

  describe('listLocks', () => {
    it('should call /lock/v1/list with resource IDs', async () => {
      const listResult = {
        count: 1,
        data: [
          {
            lockId: 'lock-1',
            resourceId: 'do_123',
            resourceType: 'Content',
            resourceInfo: '{}',
            createdBy: 'user-1',
            creatorInfo: JSON.stringify({ name: 'Content Creator', id: 'user-1' }),
            createdOn: '2026-02-20T12:00:00.000Z',
            deviceId: 'device-1',
            expiresAt: '2026-02-20T12:02:00.000Z',
          },
        ],
      };
      mockPost.mockResolvedValue({ data: listResult, status: 200, headers: {} });

      const result = await service.listLocks(['do_123', 'do_456']);

      expect(mockPost).toHaveBeenCalledWith('/lock/v1/list', {
        request: {
          filters: { resourceId: ['do_123', 'do_456'] },
        },
      });
      expect(result.data.count).toBe(1);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0]!.resourceId).toBe('do_123');
    });

    it('should handle empty resource IDs', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, data: [] }, status: 200, headers: {} });

      const result = await service.listLocks([]);

      expect(mockPost).toHaveBeenCalledWith('/lock/v1/list', {
        request: {
          filters: { resourceId: [] },
        },
      });
      expect(result.data.count).toBe(0);
      expect(result.data.data).toHaveLength(0);
    });

    it('should propagate errors from the API', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(service.listLocks(['do_123'])).rejects.toThrow('Network error');
    });
  });
});
