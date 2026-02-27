import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewPageHeader from './ReviewPageHeader';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'back': 'Back',
        'loading': 'Loading',
        'checklistDialog.publishing': 'Publishing...',
        'checklistDialog.publish': 'Publish',
        'checklistDialog.requestForChanges': 'Request for Changes',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ReviewPageHeader', () => {
  const mockOnBack = vi.fn();
  const mockOnPublish = vi.fn();
  const mockOnRequestChanges = vi.fn();

  const defaultProps = {
    onBack: mockOnBack,
    isReviewMode: false,
    onPublish: mockOnPublish,
    onRequestChanges: mockOnRequestChanges,
    isSubmitting: false,
    isLoadingPublishForm: false,
    isLoadingRequestChangesForm: false,
    dialogMode: null as 'publish' | 'request-changes' | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render back button', () => {
    render(<ReviewPageHeader {...defaultProps} />);
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    render(<ReviewPageHeader {...defaultProps} />);
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should not render action buttons when not in review mode', () => {
    render(<ReviewPageHeader {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request for changes/i })).not.toBeInTheDocument();
  });

  it('should render action buttons when in review mode', () => {
    render(<ReviewPageHeader {...defaultProps} isReviewMode={true} />);
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request for changes/i })).toBeInTheDocument();
  });

  it('should call onPublish when publish button is clicked', () => {
    render(<ReviewPageHeader {...defaultProps} isReviewMode={true} />);
    const publishButton = screen.getByRole('button', { name: /publish/i });
    fireEvent.click(publishButton);
    expect(mockOnPublish).toHaveBeenCalledTimes(1);
  });

  it('should call onRequestChanges when request changes button is clicked', () => {
    render(<ReviewPageHeader {...defaultProps} isReviewMode={true} />);
    const requestChangesButton = screen.getByRole('button', { name: /request for changes/i });
    fireEvent.click(requestChangesButton);
    expect(mockOnRequestChanges).toHaveBeenCalledTimes(1);
  });

  it('should disable publish button when loading publish form', () => {
    render(<ReviewPageHeader {...defaultProps} isReviewMode={true} isLoadingPublishForm={true} />);
    const publishButton = screen.getByRole('button', { name: /loading/i });
    expect(publishButton).toBeDisabled();
  });

  it('should disable request changes button when loading request changes form', () => {
    render(<ReviewPageHeader {...defaultProps} isReviewMode={true} isLoadingRequestChangesForm={true} />);
    const requestChangesButton = screen.getByRole('button', { name: /loading/i });
    expect(requestChangesButton).toBeDisabled();
  });

  it('should show "Publishing..." when submitting in publish mode', () => {
    render(<ReviewPageHeader {...defaultProps} isReviewMode={true} isSubmitting={true} dialogMode="publish" />);
    expect(screen.getByRole('button', { name: /publishing/i })).toBeInTheDocument();
  });

  it('should disable action buttons when submitting', () => {
    render(<ReviewPageHeader {...defaultProps} isReviewMode={true} isSubmitting={true} />);
    const publishButton = screen.getByRole('button', { name: /publish/i });
    const requestChangesButton = screen.getByRole('button', { name: /request for changes/i });
    expect(publishButton).toBeDisabled();
    expect(requestChangesButton).toBeDisabled();
  });
});
