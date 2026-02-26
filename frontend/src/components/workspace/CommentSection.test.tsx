import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import CommentSection from './CommentSection';
import reviewCommentService from '@/services/ReviewCommentService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { UserService } from '@/services/UserService';

vi.mock('@/services/ReviewCommentService');
vi.mock('@/services/userAuthInfoService/userAuthInfoService');
vi.mock('@/services/UserService');

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
    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      comments: [] 
    });

    render(<CommentSection contentId="test-content-id" />, { wrapper });
    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
  });

  it('should not render when no comments exist and not in review mode', async () => {
    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      comments: [] 
    });

    const { container } = render(<CommentSection contentId="test-content-id" />, { wrapper });
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render empty state in review mode with no comments', async () => {
    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      comments: [] 
    });

    render(<CommentSection contentId="test-content-id" isReviewMode={true} />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('No comments yet. Add the first comment below.')).toBeInTheDocument();
    });
  });

  it('should render comments when they exist', async () => {
    const mockComments = [
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

    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      comments: mockComments 
    });

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
    const mockComments = [
      {
        identifier: '1',
        comment: 'Existing comment',
        createdBy: 'User 1',
        createdOn: '2026-02-26T10:00:00Z',
      },
    ];

    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      comments: mockComments 
    });

    vi.mocked(reviewCommentService.createComment).mockResolvedValue({ 
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
      expect(reviewCommentService.createComment).toHaveBeenCalledWith({
        contextDetails: {
          contentId: 'test-content-id',
          contentVer: '0',
          contentType: 'application/vnd.ekstep.ecml-archive',
        },
        body: 'New test comment',
        userId: 'user-123',
        userInfo: {
          name: 'Test User',
        },
      });
      expect(textarea).toHaveValue('');
    });
  });

  it('should disable submit button when comment is empty', async () => {
    const mockComments = [
      {
        identifier: '1',
        comment: 'Test comment',
        createdBy: 'User 1',
        createdOn: '2026-02-26T10:00:00Z',
      },
    ];

    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      comments: mockComments 
    });

    render(<CommentSection contentId="test-content-id" isReviewMode={true} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /add comment/i });
    expect(submitButton).toBeDisabled();
  });

  it('should handle error loading comments', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(reviewCommentService.readComments).mockRejectedValue(new Error('Network error'));

    const { container } = render(<CommentSection contentId="test-content-id" />, { wrapper });

    await waitFor(() => {
      // The error is logged from the component, not the hook
      expect(container.firstChild).toBeNull();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should pass stageId to the hook when provided', async () => {
    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      comments: [] 
    });

    render(
      <CommentSection 
        contentId="test-content-id" 
        stageId="stage-123"
        isReviewMode={true}
      />, 
      { wrapper }
    );

    await waitFor(() => {
      expect(reviewCommentService.readComments).toHaveBeenCalledWith({
        contentId: 'test-content-id',
        contentVer: '0',
        contentType: 'application/vnd.ekstep.ecml-archive',
        stageId: 'stage-123',
      });
    });
  });
});
