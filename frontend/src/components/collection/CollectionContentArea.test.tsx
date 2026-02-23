import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CollectionContentArea from './CollectionContentArea';

// Mock child components to verify conditional rendering
vi.mock('@/components/collection/CollectionOverview', () => ({
  default: () => <div data-testid="collection-overview" />
}));
vi.mock('@/components/collection/CollectionSidebar', () => ({
  default: () => <div data-testid="collection-sidebar" />
}));
vi.mock('@/components/collection/BatchCard', () => ({
  default: () => <div data-testid="batch-card" />
}));
vi.mock('@/components/collection/LoginToUnlockCard', () => ({
  default: () => <div data-testid="login-unlock-card" />
}));
vi.mock('@/components/collection/CourseProgressCard', () => ({
  default: () => <div data-testid="course-progress-card" />
}));
vi.mock('@/components/collection/AvailableBatchesCard', () => ({
  default: () => <div data-testid="available-batches-card" />
}));
vi.mock('@/components/collection/CertificateCard', () => ({
  default: () => <div data-testid="certificate-card" />
}));
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key })
}));

describe('CollectionContentArea', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultProps: any = {
    collectionData: { title: 'Test Collection', lessons: 5, modules: [] },
    contentId: undefined,
    isTrackable: false,
    contentBlocked: false,
    isEnrolledInCurrentBatch: false,
    playerMetadata: {},
    playerIsLoading: false,
    playerError: null,
    handlePlayerEvent: vi.fn(),
    handleTelemetryEvent: vi.fn(),
    isAuthenticated: false,
    isContentCreator: false,
    collectionId: 'col_123',
    hasBatchInRoute: false,
    courseProgressProps: { progress: 50 },
    batchIdParam: undefined,
    expandedModules: [],
    toggleModule: vi.fn(),
    contentStatusMap: {},
    batches: [],
    selectedBatchId: '',
    setSelectedBatchId: vi.fn(),
    handleJoinCourse: vi.fn(),
    batchListLoading: false,
    joinLoading: false,
    batchListError: null,
    joinError: null,
    hasCertificate: false,
    firstCertPreviewUrl: undefined,
    setCertificatePreviewUrl: vi.fn(),
    setCertificatePreviewOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and CollectionOverview/CollectionSidebar by default', () => {
    render(<CollectionContentArea {...defaultProps} />);
    
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
    expect(screen.getByText(/5 contentStats\.lessons/i)).toBeInTheDocument();
    expect(screen.getByTestId('collection-overview')).toBeInTheDocument();
    expect(screen.getByTestId('collection-sidebar')).toBeInTheDocument();
  });

  it('renders BatchCard when user is creator (isAuthenticated && isContentCreator && collectionId)', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        isAuthenticated={true}
        isContentCreator={true}
        collectionId="col_123"
      />
    );
    expect(screen.getByTestId('batch-card')).toBeInTheDocument();
  });

  it('does NOT render BatchCard when user is not a creator', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        isAuthenticated={true}
        isContentCreator={false}
      />
    );
    expect(screen.queryByTestId('batch-card')).not.toBeInTheDocument();
  });

  it('renders LoginToUnlockCard when contentBlocked is true', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        contentBlocked={true}
      />
    );
    expect(screen.getByTestId('login-unlock-card')).toBeInTheDocument();
    // Cannot show courses info if blocked
    expect(screen.queryByTestId('course-progress-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('available-batches-card')).not.toBeInTheDocument();
  });

  it('renders CourseProgressCard when trackable, not blocked, enrolled, and within a batch route', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        isTrackable={true}
        contentBlocked={false}
        hasBatchInRoute={true}
        isEnrolledInCurrentBatch={true}
      />
    );
    expect(screen.queryByTestId('login-unlock-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('course-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('certificate-card')).toBeInTheDocument();
    // No "AvailableBatchesCard" because they are in a batch route
    expect(screen.queryByTestId('available-batches-card')).not.toBeInTheDocument();
  });

  it('renders AvailableBatchesCard when trackable, not blocked, and NOT in batch route', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        isTrackable={true}
        contentBlocked={false}
        hasBatchInRoute={false}
      />
    );
    expect(screen.queryByTestId('login-unlock-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('course-progress-card')).not.toBeInTheDocument();
    // Not in batch, so show available batches
    expect(screen.getByTestId('available-batches-card')).toBeInTheDocument();
    expect(screen.getByTestId('certificate-card')).toBeInTheDocument();
  });
});
