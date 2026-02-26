import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useReviewComment } from './useReviewComment';
import reviewCommentService from '@/services/ReviewCommentService';

// Mock the review comment service
vi.mock('@/services/ReviewCommentService', () => ({
  default: {
    readComments: vi.fn(),
    createComment: vi.fn(),
    deleteComments: vi.fn(),
  },
}));

describe('useReviewComment', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockOptions = {
    contentId: 'do_123',
    contentVer: '1.0',
    contentType: 'Resource',
    stageId: 'stage_1',
  };

  describe('readComments', () => {
    it('should fetch comments successfully', async () => {
      const mockComments = [
        {
          identifier: 'thread-123',
          comment: 'Test comment',
          createdBy: 'John Doe',
          createdOn: '2024-01-01T00:00:00Z',
          stageId: 'stage_1',
          userId: 'user_123',
        },
      ];

      vi.mocked(reviewCommentService.readComments).mockResolvedValue({
        comments: mockComments,
      });

      const { result } = renderHook(() => useReviewComment(mockOptions), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      expect(result.current.comments).toEqual(mockComments);
      expect(reviewCommentService.readComments).toHaveBeenCalledWith({
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
        stageId: 'stage_1',
      });
    });

    it('should handle empty comments', async () => {
      vi.mocked(reviewCommentService.readComments).mockResolvedValue({
        comments: [],
      });

      const { result } = renderHook(() => useReviewComment(mockOptions), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      expect(result.current.comments).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Network error');
      vi.mocked(reviewCommentService.readComments).mockRejectedValue(mockError);

      const { result } = renderHook(() => useReviewComment(mockOptions), { wrapper });

      await waitFor(() => {
        expect(result.current.commentsError).toBeTruthy();
      });

      expect(result.current.comments).toEqual([]);
    });

    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(
        () => useReviewComment({ ...mockOptions, enabled: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      expect(reviewCommentService.readComments).not.toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('should create comment successfully', async () => {
      vi.mocked(reviewCommentService.readComments).mockResolvedValue({
        comments: [],
      });

      vi.mocked(reviewCommentService.createComment).mockResolvedValue({
        created: 'OK',
        threadId: 'thread-123',
      });

      const { result } = renderHook(() => useReviewComment(mockOptions), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      await result.current.createComment('Test comment', 'user_123', {
        name: 'John Doe',
        logo: 'https://example.com/avatar.jpg',
      });

      expect(reviewCommentService.createComment).toHaveBeenCalledWith({
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
      });
    });

    it('should handle create comment error', async () => {
      vi.mocked(reviewCommentService.readComments).mockResolvedValue({
        comments: [],
      });

      const mockError = new Error('Create failed');
      vi.mocked(reviewCommentService.createComment).mockRejectedValue(mockError);

      const { result } = renderHook(() => useReviewComment(mockOptions), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      await expect(
        result.current.createComment('Test comment', 'user_123', { name: 'John Doe' })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('deleteComments', () => {
    it('should delete comments successfully', async () => {
      vi.mocked(reviewCommentService.readComments).mockResolvedValue({
        comments: [],
      });

      vi.mocked(reviewCommentService.deleteComments).mockResolvedValue({
        deleted: 'OK',
      });

      const { result } = renderHook(() => useReviewComment(mockOptions), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      await result.current.deleteComments();

      expect(reviewCommentService.deleteComments).toHaveBeenCalledWith({
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
        stageId: 'stage_1',
      });
    });

    it('should handle delete comments error', async () => {
      vi.mocked(reviewCommentService.readComments).mockResolvedValue({
        comments: [],
      });

      const mockError = new Error('Delete failed');
      vi.mocked(reviewCommentService.deleteComments).mockRejectedValue(mockError);

      const { result } = renderHook(() => useReviewComment(mockOptions), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      await expect(result.current.deleteComments()).rejects.toThrow('Delete failed');
    });
  });

  describe('without stageId', () => {
    it('should work without stageId', async () => {
      const optionsWithoutStage = {
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      };

      vi.mocked(reviewCommentService.readComments).mockResolvedValue({
        comments: [],
      });

      const { result } = renderHook(() => useReviewComment(optionsWithoutStage), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingComments).toBe(false);
      });

      expect(reviewCommentService.readComments).toHaveBeenCalledWith({
        contentId: 'do_123',
        contentVer: '1.0',
        contentType: 'Resource',
      });
    });
  });
});
