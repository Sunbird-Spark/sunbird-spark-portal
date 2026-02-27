import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentPlayerSection from './ReviewPlayerSection';

vi.mock('@/components/players', () => ({
  ContentPlayer: ({ metadata }: { metadata: any }) => (
    <div data-testid="content-player">Player for {metadata.name}</div>
  ),
}));

vi.mock('./CommentSection', () => ({
  default: ({ contentId }: { contentId: string }) => (
    <div data-testid="comment-section">Comments for {contentId}</div>
  ),
}));

describe('ContentPlayerSection', () => {
  const mockHandlePlayerEvent = vi.fn();
  const mockHandleTelemetryEvent = vi.fn();

  const mockPlayerMetadata = {
    name: 'Test Content',
    mimeType: 'application/vnd.ekstep.ecml-archive',
  };

  const defaultProps = {
    playerMetadata: mockPlayerMetadata,
    handlePlayerEvent: mockHandlePlayerEvent,
    handleTelemetryEvent: mockHandleTelemetryEvent,
    isEcmlContent: false,
    contentId: 'test-content-id',
    contentVer: '1.0',
    contentType: 'application/vnd.ekstep.ecml-archive',
    isReviewMode: false,
    contentName: 'Test Content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render content title', () => {
    render(<ContentPlayerSection {...defaultProps} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render content player', () => {
    render(<ContentPlayerSection {...defaultProps} />);
    expect(screen.getByTestId('content-player')).toBeInTheDocument();
  });

  it('should not render comment section for non-ECML content', () => {
    render(<ContentPlayerSection {...defaultProps} isEcmlContent={false} />);
    expect(screen.queryByTestId('comment-section')).not.toBeInTheDocument();
  });

  it('should render comment section for ECML content', () => {
    render(<ContentPlayerSection {...defaultProps} isEcmlContent={true} />);
    expect(screen.getByTestId('comment-section')).toBeInTheDocument();
  });

  it('should not render comment section when contentId is not provided', () => {
    render(<ContentPlayerSection {...defaultProps} isEcmlContent={true} contentId={undefined} />);
    expect(screen.queryByTestId('comment-section')).not.toBeInTheDocument();
  });

  it('should render player and comments in flex layout for ECML content', () => {
    const { container } = render(<ContentPlayerSection {...defaultProps} isEcmlContent={true} />);
    const flexContainer = container.querySelector('[style*="display: flex"]');
    expect(flexContainer).toBeInTheDocument();
  });

  it('should pass correct props to comment section', () => {
    render(
      <ContentPlayerSection
        {...defaultProps}
        isEcmlContent={true}
        contentId="test-id"
        contentVer="2.0"
        isReviewMode={true}
      />
    );
    expect(screen.getByText('Comments for test-id')).toBeInTheDocument();
  });

  it('should use default contentVer when not provided', () => {
    render(<ContentPlayerSection {...defaultProps} isEcmlContent={true} contentVer={undefined} />);
    expect(screen.getByTestId('comment-section')).toBeInTheDocument();
  });

  it('should use default contentType when not provided', () => {
    render(<ContentPlayerSection {...defaultProps} isEcmlContent={true} contentType={undefined} />);
    expect(screen.getByTestId('comment-section')).toBeInTheDocument();
  });
});
