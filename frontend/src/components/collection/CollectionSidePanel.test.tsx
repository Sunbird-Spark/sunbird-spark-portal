import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionSidePanel from './CollectionSidePanel';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
vi.mock('@/hooks/useAppI18n', () => ({ useAppI18n: () => ({ t: (k: string) => k }) }));
vi.mock('@/components/collection/CollectionSidebar', () => ({ default: () => <div data-testid="collection-sidebar" /> }));
vi.mock('@/components/collection/BatchCard', () => ({ default: () => <div data-testid="batch-card" /> }));
vi.mock('@/components/collection/LoginToUnlockCard', () => ({ default: () => <div data-testid="login-unlock-card" /> }));
vi.mock('@/components/collection/LearnerBottomCards', () => ({
  default: ({ onCertificatePreviewClick }: any) => (
    <button data-testid="cert-preview-trigger" onClick={onCertificatePreviewClick}>Preview Cert</button>
  ),
}));

const makeAccess = (overrides = {}) => ({
  isTrackable: false,
  isAuthenticated: false,
  hasBatchInRoute: false,
  isEnrolledInCurrentBatch: false,
  contentBlocked: false,
  upcomingBatchBlocked: false,
  ...overrides,
});

const makeEnrollment = () => ({
  contentStatusMap: {},
  contentAttemptInfoMap: {},
  batches: [],
  selectedBatchId: '',
  setSelectedBatchId: vi.fn(),
  handleJoinCourse: vi.fn(),
  batchListLoading: false,
  joinLoading: false,
  batchListError: null,
  joinError: null,
  hasCertificate: false,
  firstCertPreviewUrl: undefined as string | undefined,
  setCertificatePreviewUrl: vi.fn(),
  setCertificatePreviewOpen: vi.fn(),
  courseProgressProps: null,
});

const makeSidebar = () => ({
  expandedModules: [],
  toggleModule: vi.fn(),
  collectionId: 'coll-1',
  batchIdParam: undefined,
});

const makeCreator = (overrides = {}) => ({
  isCreatorViewingOwnCollection: false,
  contentCreatorPrivilege: false,
  userProfile: null,
  isMentorViewingCourse: false,
  ...overrides,
});

const defaultCollectionData = {
  title: 'Test Course',
  children: [],
  channel: 'channel-1',
};

describe('CollectionSidePanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders CollectionSidebar', () => {
    render(
      <CollectionSidePanel
        contentId="content-1"
        access={makeAccess()}
        enrollment={makeEnrollment()}
        sidebar={makeSidebar()}
        creator={makeCreator()}
        collectionData={defaultCollectionData}
        leftColHeight={undefined}
        showCertificateCard={false}
        showBottomSections={false}
        showProfileDataSharingCard={false}
        backTo="/workspace"
      />
    );
    expect(screen.getByTestId('collection-sidebar')).toBeInTheDocument();
  });

  it('shows view dashboard button when creator is viewing own collection', () => {
    render(
      <CollectionSidePanel
        contentId="content-1"
        access={makeAccess({ isTrackable: true, isAuthenticated: true })}
        enrollment={makeEnrollment()}
        sidebar={makeSidebar()}
        creator={makeCreator({ isCreatorViewingOwnCollection: true })}
        collectionData={defaultCollectionData}
        leftColHeight={undefined}
        showCertificateCard={false}
        showBottomSections={false}
        showProfileDataSharingCard={false}
        backTo="/workspace"
      />
    );
    expect(screen.getByTestId('view-dashboard-btn')).toBeInTheDocument();
  });

  it('clicking view dashboard navigates to the correct path', () => {
    render(
      <CollectionSidePanel
        contentId="content-1"
        access={makeAccess({ isTrackable: true, isAuthenticated: true })}
        enrollment={makeEnrollment()}
        sidebar={makeSidebar()}
        creator={makeCreator({ isCreatorViewingOwnCollection: true })}
        collectionData={defaultCollectionData}
        leftColHeight={undefined}
        showCertificateCard={false}
        showBottomSections={false}
        showProfileDataSharingCard={false}
        backTo="/workspace"
      />
    );
    fireEvent.click(screen.getByTestId('view-dashboard-btn'));
    expect(mockNavigate).toHaveBeenCalledWith(
      '/collection/coll-1/dashboard/batches',
      expect.objectContaining({ state: { from: '/workspace' } })
    );
  });

  it('certPreviewClick calls setCertificatePreviewUrl and setCertificatePreviewOpen when url is set', () => {
    const enrollment = makeEnrollment();
    enrollment.firstCertPreviewUrl = 'https://example.com/cert.svg';
    render(
      <CollectionSidePanel
        contentId="content-1"
        access={makeAccess({ isTrackable: true, isAuthenticated: true })}
        enrollment={enrollment}
        sidebar={makeSidebar()}
        creator={makeCreator()}
        collectionData={defaultCollectionData}
        leftColHeight={undefined}
        showCertificateCard={false}
        showBottomSections={true}
        showProfileDataSharingCard={false}
        backTo="/workspace"
      />
    );
    fireEvent.click(screen.getByTestId('cert-preview-trigger'));
    expect(enrollment.setCertificatePreviewUrl).toHaveBeenCalledWith('https://example.com/cert.svg');
    expect(enrollment.setCertificatePreviewOpen).toHaveBeenCalledWith(true);
  });

  it('certPreviewClick does nothing when firstCertPreviewUrl is undefined', () => {
    const enrollment = makeEnrollment();
    render(
      <CollectionSidePanel
        contentId="content-1"
        access={makeAccess({ isTrackable: true, isAuthenticated: true })}
        enrollment={enrollment}
        sidebar={makeSidebar()}
        creator={makeCreator()}
        collectionData={defaultCollectionData}
        leftColHeight={undefined}
        showCertificateCard={false}
        showBottomSections={true}
        showProfileDataSharingCard={false}
        backTo="/workspace"
      />
    );
    fireEvent.click(screen.getByTestId('cert-preview-trigger'));
    expect(enrollment.setCertificatePreviewUrl).not.toHaveBeenCalled();
    expect(enrollment.setCertificatePreviewOpen).not.toHaveBeenCalled();
  });

  it('shows LoginToUnlockCard when contentBlocked and not authenticated', () => {
    render(
      <CollectionSidePanel
        contentId="content-1"
        access={makeAccess({ contentBlocked: true, isAuthenticated: false })}
        enrollment={makeEnrollment()}
        sidebar={makeSidebar()}
        creator={makeCreator()}
        collectionData={defaultCollectionData}
        leftColHeight={undefined}
        showCertificateCard={false}
        showBottomSections={false}
        showProfileDataSharingCard={false}
        backTo="/workspace"
      />
    );
    expect(screen.getByTestId('login-unlock-card')).toBeInTheDocument();
  });
});
