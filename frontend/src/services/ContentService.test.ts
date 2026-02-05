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

  it('should call client.get with correct url and return data on success', async () => {
    const mockResponse = {
      data: { id: '123', name: 'Test Content' },
      status: 200,
      headers: {}
    };
    (mockClient.get as any).mockResolvedValue(mockResponse);

    const result = await service.getContent();

    expect(mockClient.get).toHaveBeenCalledWith('/content');
    expect(result).toEqual(mockResponse);
  });

  it('should propagate error when client throws', async () => {
    const error = new Error('Network error');
    (mockClient.get as any).mockRejectedValue(error);

    await expect(service.getContent()).rejects.toThrow('Network error');
    expect(mockClient.get).toHaveBeenCalledWith('/content');
  });
});
