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
      patch: vi.fn(),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callUrl = (mockClient as any).get.mock.calls[0][0] as string;
    expect(callUrl).toContain('/content/v1/read/do_123?fields=');
    expect(callUrl).toContain('body');
    expect(callUrl).toContain('mimeType');
    expect(callUrl).toContain('artifactUrl');
  });

  it('should call contentRead with custom fields when provided', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: { content: {} }, status: 200, headers: {} });
    await service.contentRead('do_456', ['name', 'description']);
    expect(mockClient.get).toHaveBeenCalledWith('/content/v1/read/do_456?fields=name%2Cdescription');
  });

  it('should call contentRead with no query string when empty array provided', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: { content: {} }, status: 200, headers: {} });
    await service.contentRead('do_789', []);
    expect(mockClient.get).toHaveBeenCalledWith('/content/v1/read/do_789');
  });

  describe('contentPublish', () => {
    it('should call client.post with correct URL and request body', async () => {
      mockClient.post = vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} });
      await service.contentPublish('do_123', 'user-1');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/publish/do_123',
        {
          request: {
            content: {
              lastPublishedBy: 'user-1',
            },
          },
        }
      );
    });
  });

  describe('contentReject', () => {
    it('should call client.post with reject reasons and comment', async () => {
      mockClient.post = vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} });
      await service.contentReject('do_456', ['Inappropriate content', 'Low quality'], 'Needs major revisions');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/reject/do_456', {
          request: {
            content: {
              rejectReasons: ['Inappropriate content', 'Low quality'],
              rejectComment: 'Needs major revisions',
            },
          },
      });
    });

    it('should default rejectComment to empty string when not provided', async () => {
      mockClient.post = vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} });
      await service.contentReject('do_101', ['Bad formatting']);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/reject/do_101',
        {
          request: {
            content: {
              rejectReasons: ['Bad formatting'],
              rejectComment: '',
            },
          },
        }
      );
    });
  });

  describe('contentCreate', () => {
    const mockCreateResponse = {
      data: {
        content_id: 'do_new_123',
        identifier: 'do_new_123',
        node_id: 'do_new_123',
        versionKey: '123456',
      },
      status: 200,
      headers: {},
    };

    beforeEach(() => {
      mockClient.post = vi.fn().mockResolvedValue(mockCreateResponse);
      // Mock crypto.randomUUID
      vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid-1234' });
    });

    it('should call client.post with correct endpoint and default fields', async () => {
      await service.contentCreate('My Content', {
        createdBy: 'user-1',
        creator: 'Test User',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/create',
        {
          request: {
            content: {
              name: 'My Content',
              code: 'mock-uuid-1234',
              createdBy: 'user-1',
              creator: 'Test User',
              mimeType: 'application/vnd.ekstep.ecml-archive',
              contentType: 'Resource',
              primaryCategory: 'Learning Resource',
            },
          },
        }
      );
    });

    it('should use custom mimeType when provided', async () => {
      await service.contentCreate('My Content', {
        createdBy: 'user-1',
        creator: 'Test User',
        mimeType: 'application/pdf',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/create',
        expect.objectContaining({
          request: expect.objectContaining({
            content: expect.objectContaining({
              mimeType: 'application/pdf',
            }),
          }),
        })
      );
    });

    it('should use custom contentType when provided', async () => {
      await service.contentCreate('My Content', {
        createdBy: 'user-1',
        creator: 'Test User',
        contentType: 'Course',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/create',
        expect.objectContaining({
          request: expect.objectContaining({
            content: expect.objectContaining({
              contentType: 'Course',
            }),
          }),
        })
      );
    });

    it('should use custom primaryCategory when provided', async () => {
      await service.contentCreate('My Content', {
        createdBy: 'user-1',
        creator: 'Test User',
        primaryCategory: 'Course Assessment',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/create',
        expect.objectContaining({
          request: expect.objectContaining({
            content: expect.objectContaining({
              primaryCategory: 'Course Assessment',
            }),
          }),
        })
      );
    });

    it('should include framework when provided', async () => {
      await service.contentCreate('My Content', {
        createdBy: 'user-1',
        creator: 'Test User',
        framework: 'TPD',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/content/v1/create',
        expect.objectContaining({
          request: expect.objectContaining({
            content: expect.objectContaining({
              framework: 'TPD',
            }),
          }),
        })
      );
    });

    it('should not include framework when not provided', async () => {
      await service.contentCreate('My Content', {
        createdBy: 'user-1',
        creator: 'Test User',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callArgs = (mockClient as any).post.mock.calls[0][1];
      expect(callArgs.request.content).not.toHaveProperty('framework');
    });

    it('should return the create response', async () => {
      const result = await service.contentCreate('My Content', {
        createdBy: 'user-1',
        creator: 'Test User',
      });

      expect(result.data.identifier).toBe('do_new_123');
      expect(result.data.content_id).toBe('do_new_123');
      expect(result.status).toBe(200);
    });
  });
});
