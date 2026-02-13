import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentService } from './ContentService';
import { IHttpClient, init } from '../lib/http-client';

describe('ContentService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ data: [], status: 200, headers: {} }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    // Initialize the singleton with our mock
    init(mockClient);
  });

  it('should call client.post for contentSearch with request body', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ data: { content: [], QuestionSet: [] }, status: 200, headers: {} });
    const service = new ContentService();
    await service.contentSearch({ sort_by: { lastUpdatedOn: 'desc' } });
    expect(mockClient.post).toHaveBeenCalledWith(
      '/composite/v1/search',
      expect.objectContaining({
        request: expect.objectContaining({
          filters: {},
          limit: 20,
          offset: 0,
          query: '',
          sort_by: { lastUpdatedOn: 'desc' },
        }),
      })
    );
  });
});
