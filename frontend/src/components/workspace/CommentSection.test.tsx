import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import CommentSection from './CommentSection';
import reviewCommentService from '@/services/ReviewCommentService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { UserService } from '@/services/UserService';

vi.mock('@/services/ReviewCommentService');
vi.mock('@/services/userAuthInfoService/userAuthInfoService');
vi.mock('@/services/UserService');

describe('CommentSection', () => {
  beforeEach(() => {
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

  it('should show loading state initially', () => {
    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      responseCode: 'OK',
      result: { comments: [] } 
    });

    render(<CommentSection contentId="test-content-id" />);
    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
  });

  it('should not render when no comments exist', async () => {
    vi.mocked(reviewCommentService.readComments).mockResolvedValue({ 
      responseCode: 'OK',
      result: { comments: [] } 
    });

    const { container } = render(<CommentSection contentId="test-content-id" />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
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
      responseCode: 'OK',
      result: { comments: mockComments } 
    });

    render(<CommentSection contentId="test-content-id" />);

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

    vi.mocked(reviewCommentService.readComments)
      .mockResolvedValueOnce({ 
        responseCode: 'OK',
        result: { comments: mockComments } 
      })
      .mockResolvedValueOnce({ 
        responseCode: 'OK',
        result: { comments: mockComments } 
      });

    vi.mocked(reviewCommentService.createComment).mockResolvedValue({ 
      responseCode: 'OK',
      result: { created: 'OK', threadId: 'thread-123' } 
    });

    const user = userEvent.setup();
    render(<CommentSection contentId="test-content-id" isReviewMode={true} />);

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Add a comment...');
    const submitButton = screen.getByRole('button', { name: /add comment/i });

    await user.type(textarea, 'New test comment');
    await user.click(submitButton);

    await waitFor(() => {
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
      responseCode: 'OK',
      result: { comments: mockComments } 
    });

    render(<CommentSection contentId="test-content-id" isReviewMode={true} />);

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /add comment/i });
    expect(submitButton).toBeDisabled();
  });
});
