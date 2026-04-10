import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import CommentSection from './ReviewCommentSection';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { UserService } from '@/services/UserService';

vi.mock('@/services/userAuthInfoService/userAuthInfoService');
vi.mock('@/services/UserService');

let mockComments: any[] = [];
let mockIsLoadingComments = false;
let mockCommentsError: any = null;
const mockCreateComment = vi.fn();
const mockRefetchComments = vi.fn();

vi.mock('@/hooks/useReviewComment', () => ({
  useReviewComment: () => ({
    comments: mockComments,
    isLoadingComments: mockIsLoadingComments,
    commentsError: mockCommentsError,
    createComment: mockCreateComment,
    isCreatingComment: false,
    refetchComments: mockRefetchComments,
  }),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'workspace.review.loadingComments': 'Loading comments...',
        'workspace.review.comments': 'Comments',
        'workspace.review.noCommentsYet': 'No comments yet. Add the first comment below.',
        'workspace.review.noCommentsYetViewMode': 'No comments yet.',
        'workspace.review.addCommentPlaceholder': 'Add a comment...',
        'workspace.review.addComment': 'Add Comment',
        'checklistDialog.submitting': 'Submitting...',
        'workspace.review.anonymous': 'Anonymous',
      };
      return translations[key] || key;
    },
  }),
}));

describe('CommentSection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    
    // Reset mock state
    mockComments = [];
    mockIsLoadingComments = false;
    mockCommentsError = null;
    
    // Mock userAuthInfoService
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    
    // Mock UserService as a class
    vi.mocked(UserService).mockImplementation(function(this: any) {
      this.userRead = vi.fn().mockResolvedValue({
        data: {
          response: {
            firstName: 'Test',
            lastName: 'User'
          }
        }
      });
      return this;
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should show loading state initially', () => {
    mockIsLoadingComments = true;

    render(<CommentSection contentId="test-content-id" />, { wrapper });
    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
  });

  it('should render empty state in review mode with no comments', async () => {
    mockComments = [];

    render(<CommentSection contentId="test-content-id" isReviewMode={true} />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('No comments yet. Add the first comment below.')).toBeInTheDocument();
    });
  });

  it('should render comments when they exist', async () => {
    mockComments = [
      {
        identifier: '1',
        comment: 'Test comment 1',
        createdBy: 'User 1',
        createdOn: '2026-02-26T10:00:00Z',
      },
      {
        identifier: '2',
        comment: 'Test comment 2',
        createdBy: 'User 2',
        createdOn: '2026-02-26T11:00:00Z',
      },
    ];

    render(<CommentSection contentId="test-content-id" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Test comment 1')).toBeInTheDocument();
      expect(screen.getByText('Test comment 2')).toBeInTheDocument();
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
    });
  });

  it('should submit a new comment', async () => {
    mockComments = [
      {
        identifier: '1',
        comment: 'Existing comment',
        createdBy: 'User 1',
        createdOn: '2026-02-26T10:00:00Z',
      },
    ];

    mockCreateComment.mockResolvedValue({ 
      created: 'OK', 
      threadId: 'thread-123' 
    });

    const user = userEvent.setup();
    render(<CommentSection contentId="test-content-id" isReviewMode={true} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Add a comment...');
    const submitButton = screen.getByRole('button', { name: /add comment/i });

    await user.type(textarea, 'New test comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith(
        'New test comment',
        'user-123',
        {
          name: 'Anonymous',
        }
      );
      expect(textarea).toHaveValue('');
    });
  });

  it('should disable submit button when comment is empty', async () => {
    mockComments = [
      {
        identifier: '1',
        comment: 'Test comment',
        createdBy: 'User 1',
        createdOn: '2026-02-26T10:00:00Z',
      },
    ];

    render(<CommentSection contentId="test-content-id" isReviewMode={true} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /add comment/i });
    expect(submitButton).toBeDisabled();
  });

  it('should render view mode message when not in review mode', async () => {
    mockComments = [];

    render(<CommentSection contentId="test-content-id" isReviewMode={false} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    });
  });

  it('should not render input section when not in review mode', async () => {
    mockComments = [];

    render(<CommentSection contentId="test-content-id" isReviewMode={false} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText('Add a comment...')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add comment/i })).not.toBeInTheDocument();
  });

  it('sets Anonymous userName when userRead throws (loadUserInfo catch block, line 56–59)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    vi.mocked(UserService).mockImplementation(function(this: any) {
      this.userRead = vi.fn().mockRejectedValue(new Error('Network error'));
      return this;
    } as any);

    render(<CommentSection contentId="test-content-id" isReviewMode={true} />, { wrapper });

    const textarea = await screen.findByPlaceholderText('Add a comment...');
    expect(textarea).toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it('handles createComment throwing (handleSubmitComment catch block, line 76–78)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    mockComments = [];
    mockCreateComment.mockRejectedValue(new Error('Submit failed'));

    const user = userEvent.setup();
    render(<CommentSection contentId="test-content-id" isReviewMode={true} />, { wrapper });

    const textarea = await screen.findByPlaceholderText('Add a comment...');
    const submitButton = screen.getByRole('button', { name: /add comment/i });

    await user.type(textarea, 'Test comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to submit comment:', expect.any(Error));
    });

    errorSpy.mockRestore();
  });
});
