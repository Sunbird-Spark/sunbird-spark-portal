import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CollectionContentArea from './CollectionContentArea';
import type { BatchListItem } from '@/types/collectionTypes';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

// Mock child components to verify conditional rendering
vi.mock('@/components/collection/CollectionOverview', () => ({
  default: ({ contentAccessBlocked }: { contentAccessBlocked?: boolean }) => (
    <div data-testid="collection-overview" data-content-access-blocked={String(!!contentAccessBlocked)} />
  ),
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
vi.mock('@/components/collection/CourseProgressSection', () => ({
  default: () => <div data-testid="course-progress-card" />
}));
vi.mock('@/components/collection/AvailableBatchesCard', () => ({
  default: () => <div data-testid="available-batches-card" />
}));
vi.mock('@/components/collection/CertificateCard', () => ({
  default: () => <div data-testid="certificate-card" />
}));
vi.mock('@/components/collection/ProfileDataSharingCard', () => ({
  default: () => <div data-testid="profile-data-sharing-card" />
}));
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key })
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));
vi.mock('@/hooks/useConsent', () => ({
  useConsent: vi.fn(() => ({
    status: null,
    lastUpdatedOn: undefined,
    updateConsent: vi.fn().mockResolvedValue(undefined),
    isUpdating: false,
  })),
}));

describe('CollectionContentArea', () => {
  const defaultAccess: {
    isTrackable: boolean;
    isAuthenticated: boolean;
    hasBatchInRoute: boolean;
    isEnrolledInCurrentBatch: boolean;
    contentBlocked: boolean;
    upcomingBatchBlocked: boolean;
    batchStartDateForOverview?: string;
  } = {
    isTrackable: false,
    isAuthenticated: false,
    hasBatchInRoute: false,
    isEnrolledInCurrentBatch: false,
    contentBlocked: false,
    upcomingBatchBlocked: false,
    batchStartDateForOverview: undefined,
  };
  const defaultPlayer = {
    playerMetadata: {},
    playerIsLoading: false,
    playerError: null as Error | null,
    handlePlayerEvent: vi.fn(),
    handleTelemetryEvent: vi.fn(),
    showMaxAttemptsExceeded: false,
  };
  const defaultEnrollment = {
    courseProgressProps: { progress: 50 },
    contentStatusMap: {},
    contentAttemptInfoMap: undefined as Record<string, { attemptCount: number }> | undefined,
    batches: [] as BatchListItem[],
    selectedBatchId: '',
    setSelectedBatchId: vi.fn(),
    handleJoinCourse: vi.fn(),
    batchListLoading: false,
    joinLoading: false,
    batchListError: null as string | null,
    joinError: null as string | null,
    hasCertificate: false,
    firstCertPreviewUrl: undefined as string | undefined,
    setCertificatePreviewUrl: vi.fn(),
    setCertificatePreviewOpen: vi.fn(),
  };
  const defaultSidebar = {
    expandedModules: [] as string[],
    toggleModule: vi.fn(),
    collectionId: 'col_123' as string | undefined,
    batchIdParam: undefined as string | undefined,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultProps: any = {
    collectionData: {
      title: 'Test Collection',
      lessons: 5,
      children: [],
      hierarchyRoot: { identifier: 'test', children: [] },
      userConsent: 'no',
      channel: 'test-channel',
    },
    contentId: undefined,
    access: defaultAccess,
    player: defaultPlayer,
    enrollment: defaultEnrollment,
    sidebar: defaultSidebar,
    creator: {},
  };

  const learnerWithBatchProps = {
    ...defaultProps,
    access: {
      ...defaultAccess,
      isTrackable: true,
      isAuthenticated: true,
      contentBlocked: false,
      hasBatchInRoute: true,
      isEnrolledInCurrentBatch: true,
    },
    creator: { contentCreatorPrivilege: false },
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

  it('renders BatchCard when user is creator viewing own trackable course (isCreatorViewingOwnCollection)', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, isTrackable: true, isAuthenticated: true }}
        sidebar={{ ...defaultSidebar, collectionId: 'col_123' }}
        creator={{ isCreatorViewingOwnCollection: true }}
      />
    );
    expect(screen.getByTestId('batch-card')).toBeInTheDocument();
  });

  it('does NOT render BatchCard when isCreatorViewingOwnCollection is false', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, isTrackable: true, isAuthenticated: true }}
        creator={{ isCreatorViewingOwnCollection: false }}
      />
    );
    expect(screen.queryByTestId('batch-card')).not.toBeInTheDocument();
  });

  it('does NOT render BatchCard for non-trackable collections even when creator is viewing own collection', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, isTrackable: false, isAuthenticated: true }}
        sidebar={{ ...defaultSidebar, collectionId: 'col_123' }}
        creator={{ isCreatorViewingOwnCollection: true }}
      />
    );
    expect(screen.queryByTestId('batch-card')).not.toBeInTheDocument();
  });

  it('renders LoginToUnlockCard when contentBlocked is true', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, contentBlocked: true }}
      />
    );
    expect(screen.getByTestId('login-unlock-card')).toBeInTheDocument();
    // Cannot show courses info if blocked
    expect(screen.queryByTestId('course-progress-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('available-batches-card')).not.toBeInTheDocument();
  });

  it('renders CourseProgressCard when trackable, authenticated, not blocked, enrolled, and within a batch route', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{
          ...defaultAccess,
          isTrackable: true,
          isAuthenticated: true,
          contentBlocked: false,
          hasBatchInRoute: true,
          isEnrolledInCurrentBatch: true,
        }}
      />
    );
    expect(screen.queryByTestId('login-unlock-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('course-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('certificate-card')).toBeInTheDocument();
    // No "AvailableBatchesCard" because they are in a batch route
    expect(screen.queryByTestId('available-batches-card')).not.toBeInTheDocument();
  });

  it('renders CourseProgressCard when enrolled in upcoming batch (content blocked but show progress for leave option)', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{
          ...defaultAccess,
          isTrackable: true,
          isAuthenticated: true,
          contentBlocked: true,
          upcomingBatchBlocked: true,
          hasBatchInRoute: true,
          isEnrolledInCurrentBatch: true,
        }}
      />
    );
    expect(screen.getByTestId('course-progress-card')).toBeInTheDocument();
  });

  it('renders AvailableBatchesCard when trackable, authenticated, not blocked, and NOT in batch route', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{
          ...defaultAccess,
          isTrackable: true,
          isAuthenticated: true,
          contentBlocked: false,
          hasBatchInRoute: false,
        }}
      />
    );
    expect(screen.queryByTestId('login-unlock-card')).not.toBeInTheDocument();
    // Not in batch, so show available batches
    expect(screen.getByTestId('available-batches-card')).toBeInTheDocument();
    // Certificate card only after enrollment
    expect(screen.queryByTestId('certificate-card')).not.toBeInTheDocument();
  });

  it('renders View Course Dashboard button when user is the course owner and collection is trackable', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, isTrackable: true, isAuthenticated: true }}
        sidebar={{ ...defaultSidebar, collectionId: 'col_123' }}
        creator={{ isCreatorViewingOwnCollection: true }}
      />
    );
    expect(screen.getByTestId('view-dashboard-btn')).toBeInTheDocument();
  });

  it('does not render View Course Dashboard button for non-owner content creators', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, isTrackable: true, isAuthenticated: true }}
        creator={{ isCreatorViewingOwnCollection: false }}
      />
    );
    expect(screen.queryByTestId('view-dashboard-btn')).not.toBeInTheDocument();
  });

  it('does not render View Course Dashboard button for unauthenticated users', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, isTrackable: true, isAuthenticated: false }}
        sidebar={{ ...defaultSidebar, collectionId: 'col_123' }}
        creator={{ isCreatorViewingOwnCollection: true }}
      />
    );
    expect(screen.queryByTestId('view-dashboard-btn')).not.toBeInTheDocument();
  });

  it('does not render View Course Dashboard button for non-trackable collections', () => {
    render(
      <CollectionContentArea
        {...defaultProps}
        access={{ ...defaultAccess, isTrackable: false, isAuthenticated: true }}
        sidebar={{ ...defaultSidebar, collectionId: 'col_123' }}
        creator={{ isCreatorViewingOwnCollection: true }}
      />
    );
    expect(screen.queryByTestId('view-dashboard-btn')).not.toBeInTheDocument();
  });

  describe('Creator viewing own collection (contentCreatorPrivilege)', () => {
    it('hides CourseProgressCard when contentCreatorPrivilege is true', () => {
      render(
        <CollectionContentArea
          {...defaultProps}
          access={{
            ...defaultAccess,
            isTrackable: true,
            contentBlocked: false,
            hasBatchInRoute: true,
            isEnrolledInCurrentBatch: true,
          }}
          creator={{ contentCreatorPrivilege: true }}
        />
      );
      expect(screen.queryByTestId('course-progress-card')).not.toBeInTheDocument();
    });

    it('hides AvailableBatchesCard and CertificateCard when contentCreatorPrivilege is true', () => {
      render(
        <CollectionContentArea
          {...defaultProps}
          access={{
            ...defaultAccess,
            isTrackable: true,
            contentBlocked: false,
            hasBatchInRoute: false,
          }}
          creator={{ contentCreatorPrivilege: true }}
        />
      );
      expect(screen.queryByTestId('available-batches-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('certificate-card')).not.toBeInTheDocument();
    });

    it('shows learner cards when contentCreatorPrivilege is false', () => {
      render(
        <CollectionContentArea
          {...defaultProps}
          access={{
            ...defaultAccess,
            isTrackable: true,
            isAuthenticated: true,
            contentBlocked: false,
            hasBatchInRoute: false,
          }}
          creator={{ contentCreatorPrivilege: false }}
        />
      );
      expect(screen.getByTestId('available-batches-card')).toBeInTheDocument();
      // Certificate card only after enrollment (not in batch route here)
      expect(screen.queryByTestId('certificate-card')).not.toBeInTheDocument();
    });

    it('shows CertificateCard when enrolled in current batch', () => {
      render(
        <CollectionContentArea
          {...defaultProps}
          access={{
            ...defaultAccess,
            isTrackable: true,
            isAuthenticated: true,
            contentBlocked: false,
            hasBatchInRoute: true,
            isEnrolledInCurrentBatch: true,
          }}
          creator={{ contentCreatorPrivilege: false }}
        />
      );
      expect(screen.getByTestId('certificate-card')).toBeInTheDocument();
    });

    it('passes contentAccessBlocked=false to CollectionOverview when contentCreatorPrivilege (content access without enrollment)', () => {
      render(
        <CollectionContentArea
          {...defaultProps}
          access={{
            ...defaultAccess,
            isTrackable: true,
            contentBlocked: false,
            isEnrolledInCurrentBatch: false,
          }}
          creator={{ contentCreatorPrivilege: true }}
        />
      );
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'false');
    });
  });

  describe('Profile Data Sharing card', () => {
    it('renders ProfileDataSharingCard when trackable, authenticated learner, in batch, enrolled, and collection has userConsent yes', () => {
      render(
        <CollectionContentArea
          {...learnerWithBatchProps}
          collectionData={{ ...defaultProps.collectionData, userConsent: 'yes', channel: 'ch1' }}
        />
      );
      expect(screen.getByTestId('profile-data-sharing-card')).toBeInTheDocument();
    });

    it('does not render ProfileDataSharingCard when collection userConsent is not yes', () => {
      render(
        <CollectionContentArea
          {...learnerWithBatchProps}
          collectionData={{ ...defaultProps.collectionData, userConsent: 'no', channel: 'ch1' }}
        />
      );
      expect(screen.queryByTestId('profile-data-sharing-card')).not.toBeInTheDocument();
    });

    it('does not render ProfileDataSharingCard when contentCreatorPrivilege is true', () => {
      render(
        <CollectionContentArea
          {...learnerWithBatchProps}
          creator={{ ...learnerWithBatchProps.creator, contentCreatorPrivilege: true }}
          collectionData={{ ...defaultProps.collectionData, userConsent: 'yes', channel: 'ch1' }}
        />
      );
      expect(screen.queryByTestId('profile-data-sharing-card')).not.toBeInTheDocument();
    });

    it('does not render ProfileDataSharingCard when not authenticated', () => {
      render(
        <CollectionContentArea
          {...learnerWithBatchProps}
          access={{ ...learnerWithBatchProps.access, isAuthenticated: false }}
          collectionData={{ ...defaultProps.collectionData, userConsent: 'yes', channel: 'ch1' }}
        />
      );
      expect(screen.queryByTestId('profile-data-sharing-card')).not.toBeInTheDocument();
    });
  });
});
