import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentService } from './ContentService';
import { IHttpClient, init } from '../lib/http-client';

describe('ContentService', () => {
  let mockClient: IHttpClient;
  let service: ContentService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a mock client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };

    // Initialize the singleton with our mock
    init(mockClient);

    // Instantiate service
    service = new ContentService();
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

  it('should call contentRead with default fields when no fields provided', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: { content: {} }, status: 200, headers: {} });
    await service.contentRead('do_123');
    const callUrl = (mockClient.get as any).mock.calls[0][0] as string;
    expect(callUrl).toContain('/content/v1/read/do_123?fields=');
    expect(callUrl).toContain('body');
    expect(callUrl).toContain('mimeType');
    expect(callUrl).toContain('artifactUrl');
  });

  it('should call contentRead with custom fields when provided', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: { content: {} }, status: 200, headers: {} });
    await service.contentRead('do_456', ['name', 'description']);
    expect(mockClient.get).toHaveBeenCalledWith('/content/v1/read/do_456?fields=name,description');
  });

  it('should call contentRead with no query string when empty array provided', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: { content: {} }, status: 200, headers: {} });
    await service.contentRead('do_789', []);
    expect(mockClient.get).toHaveBeenCalledWith('/content/v1/read/do_789');
  });
});
