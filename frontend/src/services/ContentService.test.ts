import { describe, it, expect, vi } from 'vitest';
import { ContentService } from './ContentService';
import { IHttpClient } from '../api/types';

describe('ContentService', () => {
  it('should call client.get with correct url', async () => {
    const mockClient: IHttpClient = {
      get: vi.fn().mockResolvedValue({ data: [], status: 200, headers: {} }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      setAuthHeader: vi.fn(),
      clearAuthHeader: vi.fn(),
    };

    const service = new ContentService(mockClient);
    await service.getContent();
    expect(mockClient.get).toHaveBeenCalledWith('/content');
  });
});
