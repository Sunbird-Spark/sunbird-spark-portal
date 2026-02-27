import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewCommentService } from './ReviewCommentService';

// Mock the http client
const mockPost = vi.fn();
vi.mock('../lib/http-client', () => ({
  getClient: () => ({
    post: mockPost,
  }),
}));

describe('ReviewCommentService', () => {
  let service: ReviewCommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReviewCommentService();
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const mockRequest = {
        contextDetails: {
          contentId: 'do_123',
          contentVer: '1.0',
          contentType: 'Resource',
          stageId: 'stage_1',
        },
        body: 'Test comment',
        userId: 'user_123',
        userInfo: {
          name: 'John Doe',
          logo: 'https://example.com/avatar.jpg',
        },
      };

      const mockResponse = {
        data: {
          created: 'OK',
          threadId: 'thread-123',
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.createComment(mockRequest);

      expect(mockPost).toHaveBeenCalledWith(
        '/review/comment/v1/create/comment',
        { request: mockRequest }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle create comment error', async () => {
      const mockRequest = {
        contextDetails: {
          contentId: 'do_123',
          contentVer: '1.0',
          contentType: 'Resource',
        },
        body: 'Test comment',
        userId: 'user_123',
        userInfo: {
          name: 'John Doe',
        },
      };

      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(service.createComment(mockRequest)).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledWith(
        '/review/comment/v1/create/comment',
        { request: mockRequest }
      );
    });
  });

  describe('readComments', () => {
    it('should read comments successfully', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
        stageId: 'stage_1',
      };

      const mockResponse = {
        data: {
          comments: [
            {
              identifier: 'thread-123',
              comment: 'Test comment',
              createdBy: 'John Doe',
              createdOn: '2024-01-01T00:00:00Z',
              stageId: 'stage_1',
              userId: 'user_123',
            },
          ],
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.readComments(mockRequest);

      expect(mockPost).toHaveBeenCalledWith(
        '/review/comment/v1/read/comment',
        { request: { contextDetails: mockRequest } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle read comments error', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      const mockError = new Error('Database error');
      mockPost.mockRejectedValue(mockError);

      await expect(service.readComments(mockRequest)).rejects.toThrow('Database error');
    });

    it('should handle empty comments response', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      const mockResponse = {
        data: {
          comments: [],
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.readComments(mockRequest);

      expect(result.comments).toEqual([]);
    });
  });

  describe('deleteComments', () => {
    it('should delete comments successfully', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      const mockResponse = {
        data: {
          deleted: 'OK',
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.deleteComments(mockRequest);

      expect(mockPost).toHaveBeenCalledWith(
        '/review/comment/v1/delete/comment',
        { request: { contextDetails: mockRequest } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle delete comments error', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      const mockError = new Error('Delete failed');
      mockPost.mockRejectedValue(mockError);

      await expect(service.deleteComments(mockRequest)).rejects.toThrow('Delete failed');
    });
  });

  describe('hasComments', () => {
    it('should return true when comments exist', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      const mockResponse = {
        data: {
          comments: [
            {
              identifier: 'thread-123',
              comment: 'Test comment',
              createdBy: 'John Doe',
              createdOn: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.hasComments(mockRequest);

      expect(result).toBe(true);
    });

    it('should return false when no comments exist', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      const mockResponse = {
        data: {
          comments: [],
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await service.hasComments(mockRequest);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockRequest = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockPost.mockRejectedValue(new Error('Network error'));

      const result = await service.hasComments(mockRequest);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to check for comments:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('baseUrl configuration', () => {
    it('should use correct base URL for portal data routes', () => {
      expect((service as any).baseUrl).toBe('/review/comment/v1');
    });
  });
});
