/* eslint-disable max-lines -- creator-viewing-own-collection test coverage */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CollectionDetailPage from './CollectionDetailPage';
import type { CertificatePreviewDetails } from '@/components/collection/CertificatePreviewModal';

/* ── Collection / content data ── */
const mockHierarchyRoot = {
  identifier: 'col-1',
  name: 'Test Collection',
  children: [
    {
      identifier: 'mod-1',
      name: 'Module 1',
      primaryCategory: 'Subtitle',
      mimeType: 'application/vnd.ekstep.content-collection',
      children: [
        { identifier: 'l1', name: 'Lesson 1', mimeType: 'video/mp4' },
        { identifier: 'l2', name: 'Lesson 2', mimeType: 'application/pdf' },
      ],
    },
  ],
};

const mockCollectionData = {
  id: 'col-1',
  title: 'Test Collection',
  lessons: 12,
  image: 'https://img.png',
  units: 2,
  description: 'Test description',
  audience: ['Student'],
  createdBy: undefined as string | undefined,
  children: mockHierarchyRoot.children,
  hierarchyRoot: mockHierarchyRoot,
};

/* ── Data hooks ── */
const mockUseCollection = vi.fn();
const mockUseContentSearch = vi.fn();
const mockUseContentRead = vi.fn();
const mockUseCollectionEnrollment = vi.fn();
const mockUseQumlContent = vi.fn();
vi.mock('@/hooks/useCollection', () => ({
  useCollection: (id: string | undefined) => mockUseCollection(id),
}));
vi.mock('@/hooks/useContent', () => ({
  useContentSearch: (opts: { request?: object; enabled?: boolean }) => mockUseContentSearch(opts),
  useContentRead: (contentId: string, options?: { enabled?: boolean; fields?: string[] }) => mockUseContentRead(contentId, options),
}));

const mockEnrollment = {
  enrollmentForCollection: undefined,
  isEnrolledInCurrentBatch: false,
  effectiveBatchId: undefined,
  contentStatusMap: undefined,
  courseProgressProps: undefined,
  batches: [],
  batchListLoading: false,
  batchListError: undefined,
  firstCertPreviewUrl: undefined,
  hasCertificate: false,
  joinLoading: false,
  joinError: '',
  handleJoinCourse: vi.fn(),
};

vi.mock('@/hooks/useCollectionEnrollment', () => ({
  useCollectionEnrollment: (
    collectionId: string | undefined,
    batchIdParam: string | undefined,
    collectionData: any,
    isAuthenticated: boolean
  ) => mockUseCollectionEnrollment(collectionId, batchIdParam, collectionData, isAuthenticated),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [{ code: 'en', label: 'English' }],
    currentCode: 'en',
    changeLanguage: vi.fn(),
  }),
}));

vi.mock('@/hooks/useQumlContent', () => ({
  useQumlContent: (questionSetId: string, options?: { enabled?: boolean }) => mockUseQumlContent(questionSetId, options),
}));

const mockUseCollectionDetailPlayer = vi.fn((_options: unknown) => ({
  handlePlayerEvent: vi.fn(),
  handleTelemetryEvent: vi.fn(),
}));
vi.mock('@/hooks/useCollectionDetailPlayer', () => ({
  useCollectionDetailPlayer: (options: unknown) => mockUseCollectionDetailPlayer(options),
}));
vi.mock('@/hooks/useContentPlayer', () => ({
  useContentPlayer: () => ({
    handlePlayerEvent: vi.fn(),
    handleTelemetryEvent: vi.fn(),
  }),
}));

vi.mock('@/services/collection', () => ({
  mapSearchContentToRelatedContentItems: (content?: Array<any>) => {
    return content && content.length > 0 ? content.slice(0, 3) : [];
  },
}));

/* ── Router ── */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ collectionId: 'col-123' }),
    useNavigate: () => mockNavigate,
  };
});

/* ── Auth (mutable so we can flip between tests) ── */
const mockAuthState = { isAuthenticated: false };
vi.mock('@/hooks/usePermission', () => ({
  usePermissions: () => ({
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: false,
    roles: mockAuthState.isAuthenticated ? ['CONTENT_CREATOR'] : ['PUBLIC'],
    error: null,
    hasAnyRole: vi.fn(),
    canAccessFeature: vi.fn(),
    refetch: vi.fn(),
  }),
}));
const mockGetUserId = vi.fn((): string | null => null);
const mockGetAuthInfo = vi.fn(() =>
  Promise.resolve({ sid: '', uid: null, isAuthenticated: false })
);
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    isUserAuthenticated: () => false,
    getUserId: () => mockGetUserId(),
    getAuthInfo: (...args: unknown[]) => mockGetAuthInfo(...(args as [])),
  },
}));

/* ── useIsContentCreator (mutable) ── */
let mockIsContentCreator = false;
vi.mock('@/hooks/useUser', () => ({
  useIsContentCreator: () => mockIsContentCreator,
}));

let mockUserReadData: { data?: { data?: { response?: { firstName?: string; lastName?: string } } }; isLoading?: boolean; error?: unknown } = {
  data: { data: { response: { firstName: 'Test', lastName: 'User' } } },
  isLoading: false,
  error: null,
};
vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => mockUserReadData,
}));

/* ── Child components ── */
vi.mock('@/components/home/Header', () => ({
  default: () => <header data-testid="header">Header</header>,
}));
vi.mock('@/components/home/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));
vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message, error }: { message?: string; error?: string }) => (
    <div data-testid="page-loader">{message ?? error}</div>
  ),
}));
vi.mock('@/components/collection/CollectionOverview', () => ({
  default: ({ collectionData }: { collectionData: { title: string } }) => (
    <div data-testid="collection-overview">{collectionData.title}</div>
  ),
}));
vi.mock('@/components/collection/CollectionSidebar', () => ({
  default: () => <aside data-testid="collection-sidebar">Sidebar</aside>,
}));
vi.mock('@/components/collection/BatchCard', () => ({
  default: ({ collectionId }: { collectionId: string }) => (
    <div data-testid="batch-card" data-collection-id={collectionId}>
      Batch Card
    </div>
  ),
}));
vi.mock('@/components/landing/FAQSection', () => ({
  default: () => <section data-testid="faq">FAQ</section>,
}));
vi.mock('@/components/common/RelatedContent', () => ({
  default: ({ items }: { items: { name?: string }[] }) => (
    <div data-testid="related-content">
      {items.map((i, idx) => (
        <span key={idx}>{i.name}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/collection/RelatedContentSection', () => ({
  default: ({
    searchError,
    searchFetching,
    relatedContentItems
  }: {
    searchError?: boolean;
    searchFetching?: boolean;
    relatedContentItems?: Array<{ identifier?: string; name?: string }>;
  }) => (
    <section
      data-testid="related-content-section"
      data-loading={String(!!searchFetching)}
      data-error={String(!!searchError)}
    >
      {relatedContentItems &&
        relatedContentItems.map((item) => (
          <div key={item.identifier} data-testid="related-content">
            {item.name}
          </div>
        ))}
    </section>
  ),
}));

vi.mock('@/components/collection/CollectionContentArea', () => ({
  default: ({
    collectionData,
    contentId,
    collectionId,
    isCreatorViewingOwnCollection,
    contentBlocked,
  }: {
    collectionData: any;
    contentId?: string;
    collectionId?: string;
    isCreatorViewingOwnCollection?: boolean;
    contentBlocked?: boolean;
  }) => (
    <div
      data-testid="collection-content-area"
      data-content-id={contentId ?? ''}
      data-is-creator-viewing-own={String(!!isCreatorViewingOwnCollection)}
      data-content-blocked={String(!!contentBlocked)}
    >
      <div data-testid="collection-overview">{collectionData?.title}</div>
      <div>
        {isCreatorViewingOwnCollection && (
          <div data-testid="batch-card" data-collection-id={collectionId}>
            Batch Card
          </div>
        )}
      </div>
      <aside data-testid="collection-sidebar">Sidebar</aside>
      <div>Stats: {collectionData?.lessons} lessons</div>
    </div>
  ),
}));

let lastCertificateModalDetails: CertificatePreviewDetails | undefined;
vi.mock('@/components/collection/CertificatePreviewModal', () => ({
  default: ({
    open,
    onClose: _onClose,
    details,
  }: {
    open: boolean;
    onClose: () => void;
    details?: { recipientName?: string };
  }) => {
    lastCertificateModalDetails = details;
    return open ? <div data-testid="certificate-modal">Certificate Preview</div> : null;
  },
}));

/* ── Provider wrapper ── */
const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/collection/col-123']}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
describe('CollectionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isAuthenticated = false; // default: unauthenticated
    mockIsContentCreator = false; // default: not a content creator
    mockGetUserId.mockReturnValue(null);
    mockCollectionData.createdBy = undefined;
    lastCertificateModalDetails = undefined;
    mockUserReadData = {
      data: { data: { response: { firstName: 'Test', lastName: 'User' } } },
      isLoading: false,
      error: null,
    };

    mockUseCollection.mockReturnValue({
      data: mockCollectionData,
      isLoading: false,
      isFetching: false,
      isError: false,
    });
    mockUseContentSearch.mockReturnValue({
      data: { data: { content: [] } },
      isLoading: false,
      isError: false,
      isFetching: false,
    });
    mockUseContentRead.mockReturnValue({
      data: { data: { content: null } },
      isLoading: false,
      error: null,
      isFetching: false,
    });
    mockUseCollectionEnrollment.mockReturnValue(mockEnrollment);
    mockUseQumlContent.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isFetching: false,
    });
  });

  /* ─── Loading / error states ─── */
  describe('Loading and error states', () => {
    it('renders loading state when useCollection isLoading is true', () => {
      mockUseCollection.mockReturnValue({ data: null, isLoading: true, isFetching: false, isError: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    });

    it('renders an error state when isError is true and not retrying', () => {
      mockUseCollection.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: new Error('Network error'),
        refetch: vi.fn(),
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    });

    it('renders "Collection not found" when data is null without error', () => {
      mockUseCollection.mockReturnValue({
        data: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: vi.fn(),
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    });
  });

  /* ─── Successful render ─── */
  describe('Successful render', () => {
    it('renders header and footer', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders collection title', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getAllByText('Test Collection').length).toBeGreaterThan(0);
    });

    it('renders CollectionOverview with title', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveTextContent('Test Collection');
    });

    it('renders CollectionSidebar', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-sidebar')).toBeInTheDocument();
    });

    it('renders FAQ section', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('faq')).toBeInTheDocument();
    });

    it('shows lessons count in stats row', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByText(/12/)).toBeInTheDocument();
    });

    it('calls useCollection with collectionId from route params', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(mockUseCollection).toHaveBeenCalledWith('col-123');
    });

    it('calls useContentSearch when collection data is available', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(mockUseContentSearch).toHaveBeenCalledWith(
        expect.objectContaining({ request: { limit: 20, offset: 0 }, enabled: true })
      );
    });
  });

  /* ─── Navigation ─── */
  describe('Navigation', () => {
    it('navigates back when Go Back button is clicked', () => {
      renderWithProviders(<CollectionDetailPage />);
      fireEvent.click(screen.getByRole('button', { name: /button\.goBack/i }));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  /* ─── Related content ─── */
  describe('Related content', () => {
    it('does not show related content cards when search returns empty', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByText('Related 1')).not.toBeInTheDocument();
    });

    it('shows related content items when search returns results', () => {
      mockUseContentSearch.mockReturnValue({
        data: {
          data: {
            content: [
              {
                identifier: 'search-1',
                name: 'Search Result 1',
                appIcon: '',
                posterImage: '',
                visibility: 'Default',
                mimeType: 'video/mp4',
                primaryCategory: 'Course',
              },
            ],
          },
        },
        isLoading: false,
        isError: false,
        isFetching: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByText('Search Result 1')).toBeInTheDocument();
    });
  });

  /* ─── BatchCard — authentication + role guard ─── */
  describe('BatchCard authentication guard', () => {
    it('does NOT render BatchCard when user is NOT authenticated', () => {
      mockAuthState.isAuthenticated = false;
      mockIsContentCreator = false;
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('batch-card')).not.toBeInTheDocument();
    });

    it('renders BatchCard when user is authenticated AND is the course owner', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = true;
      mockCollectionData.createdBy = 'user-1';
      mockGetUserId.mockReturnValue('user-1');
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('batch-card')).toBeInTheDocument();
    });

    it('does NOT render BatchCard when authenticated but useIsContentCreator returns false', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = false;
      mockGetUserId.mockReturnValue('user-1');
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('batch-card')).not.toBeInTheDocument();
    });

    it('does NOT render BatchCard when unauthenticated even if useIsContentCreator returns true', () => {
      mockAuthState.isAuthenticated = false;
      mockIsContentCreator = true;
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('batch-card')).not.toBeInTheDocument();
    });

    it('passes the correct collectionId to BatchCard', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = true;
      mockCollectionData.createdBy = 'user-1';
      mockGetUserId.mockReturnValue('user-1');
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('batch-card')).toHaveAttribute('data-collection-id', 'col-123');
    });
  });

  /* ─── BatchCard — position in sidebar ─── */
  describe('BatchCard DOM position', () => {
    it('renders BatchCard BEFORE CollectionSidebar in the DOM', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = true;
      mockCollectionData.createdBy = 'user-1';
      mockGetUserId.mockReturnValue('user-1');
      renderWithProviders(<CollectionDetailPage />);

      const batchCard = screen.getByTestId('batch-card');
      const sidebar = screen.getByTestId('collection-sidebar');

      // Node.DOCUMENT_POSITION_FOLLOWING (4) = sidebar comes after batchCard
      const position = batchCard.compareDocumentPosition(sidebar);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('CollectionSidebar is present after BatchCard (array index check)', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = true;
      mockCollectionData.createdBy = 'user-1';
      mockGetUserId.mockReturnValue('user-1');
      renderWithProviders(<CollectionDetailPage />);

      const batchCard = screen.getByTestId('batch-card');
      const sidebar = screen.getByTestId('collection-sidebar');
      const allWithTestId = Array.from(document.querySelectorAll('[data-testid]'));

      expect(allWithTestId.indexOf(batchCard)).toBeLessThan(
        allWithTestId.indexOf(sidebar)
      );
    });

    it('both BatchCard and CollectionSidebar share the same parent container', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = true;
      mockCollectionData.createdBy = 'user-1';
      mockGetUserId.mockReturnValue('user-1');
      renderWithProviders(<CollectionDetailPage />);

      const batchCard = screen.getByTestId('batch-card');
      const sidebar = screen.getByTestId('collection-sidebar');

      expect(batchCard.parentElement?.parentElement).toBe(
        sidebar.parentElement
      );
    });
  });

  /* ─── Creator viewing own collection ─── */
  describe('Creator viewing own collection (isCreatorViewingOwnCollection)', () => {
    const creatorUserId = 'creator-1';

    it('passes isCreatorViewingOwnCollection=true to CollectionContentArea when authenticated user is the collection creator', () => {
      mockAuthState.isAuthenticated = true;
      mockGetUserId.mockReturnValue(creatorUserId);
      mockCollectionData.createdBy = creatorUserId;
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, createdBy: creatorUserId },
        isLoading: false,
        isFetching: false,
        isError: false,
      });

      renderWithProviders(<CollectionDetailPage />);

      const contentArea = screen.getByTestId('collection-content-area');
      expect(contentArea).toHaveAttribute('data-is-creator-viewing-own', 'true');
    });

    it('passes contentBlocked=false when creator views own collection (content access without enrollment)', () => {
      mockAuthState.isAuthenticated = true;
      mockGetUserId.mockReturnValue(creatorUserId);
      mockCollectionData.createdBy = creatorUserId;
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, createdBy: creatorUserId, trackable: { enabled: 'Yes' } },
        isLoading: false,
        isFetching: false,
        isError: false,
      });

      renderWithProviders(<CollectionDetailPage />);

      const contentArea = screen.getByTestId('collection-content-area');
      expect(contentArea).toHaveAttribute('data-content-blocked', 'false');
    });

    it('does not navigate to batch URL when creator views own collection (skips batch redirect)', () => {
      mockAuthState.isAuthenticated = true;
      mockGetUserId.mockReturnValue(creatorUserId);
      mockCollectionData.createdBy = creatorUserId;
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, createdBy: creatorUserId },
        isLoading: false,
        isFetching: false,
        isError: false,
      });
      mockUseCollectionEnrollment.mockReturnValue({
        ...mockEnrollment,
        enrollmentForCollection: { batchId: 'batch-1' },
      });

      renderWithProviders(<CollectionDetailPage />);

      expect(mockNavigate).not.toHaveBeenCalledWith(
        '/collection/col-123/batch/batch-1',
        expect.anything()
      );
    });

    it('calls useCollectionDetailPlayer with skipContentStateUpdate true when creator views own collection', () => {
      mockAuthState.isAuthenticated = true;
      mockGetUserId.mockReturnValue(creatorUserId);
      mockCollectionData.createdBy = creatorUserId;
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, createdBy: creatorUserId },
        isLoading: false,
        isFetching: false,
        isError: false,
      });

      renderWithProviders(<CollectionDetailPage />);

      expect(mockUseCollectionDetailPlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          skipContentStateUpdate: true,
        })
      );
    });

    it('passes isCreatorViewingOwnCollection=false when user is not the creator', () => {
      mockAuthState.isAuthenticated = true;
      mockGetUserId.mockReturnValue('other-user-id');
      mockCollectionData.createdBy = creatorUserId;
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, createdBy: creatorUserId },
        isLoading: false,
        isFetching: false,
        isError: false,
      });

      renderWithProviders(<CollectionDetailPage />);

      const contentArea = screen.getByTestId('collection-content-area');
      expect(contentArea).toHaveAttribute('data-is-creator-viewing-own', 'false');
    });
  });

  describe('Certificate preview details', () => {
    it('passes recipientName (firstName + lastName) to CertificatePreviewModal', () => {
      mockUserReadData = {
        data: { data: { response: { firstName: 'Jane', lastName: 'Doe' } } },
        isLoading: false,
        error: null,
      };
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, title: 'My Course' },
        isLoading: false,
        isFetching: false,
        isError: false,
      });

      renderWithProviders(<CollectionDetailPage />);

      expect(lastCertificateModalDetails).toEqual({ recipientName: 'Jane Doe' });
    });

    it('passes undefined recipientName when user profile has no name', () => {
      mockUserReadData = {
        data: { data: { response: {} } },
        isLoading: false,
        error: null,
      };

      renderWithProviders(<CollectionDetailPage />);

      expect(lastCertificateModalDetails?.recipientName).toBeUndefined();
    });

    it('passes only firstName as recipientName when lastName is missing', () => {
      mockUserReadData = {
        data: { data: { response: { firstName: 'OnlyFirst' } } },
        isLoading: false,
        error: null,
      };

      renderWithProviders(<CollectionDetailPage />);

      expect(lastCertificateModalDetails?.recipientName).toBe('OnlyFirst');
    });

    it('passes only lastName as recipientName when firstName is missing', () => {
      mockUserReadData = {
        data: { data: { response: { lastName: 'OnlyLast' } } },
        isLoading: false,
        error: null,
      };

      renderWithProviders(<CollectionDetailPage />);

      expect(lastCertificateModalDetails?.recipientName).toBe('OnlyLast');
    });

  });
});
