import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermission';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import CollectionDetailPage from './CollectionDetailPage';
const mockCollectionData = {
  id: 'col-1',
  title: 'Test Collection',
  lessons: 12,
  image: 'https://img.png',
  units: 2,
  description: 'Test description',
  audience: ['Student'],
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
  hierarchyRoot: {
    identifier: 'col-1',
    mimeType: 'application/vnd.ekstep.content-collection',
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
  },
};
const mockUseCollection = vi.fn();
const mockUseContentSearch = vi.fn();
const mockUseContentRead = vi.fn();
const mockUseQumlContent = vi.fn();
vi.mock('@/hooks/useCollection', () => ({
  useCollection: (id: string | undefined) => mockUseCollection(id),
}));
const mockEnrollment = {
  enrollmentForCollection: undefined as { batchId: string } | undefined,
  isEnrolledInCurrentBatch: false,
  effectiveBatchId: undefined as string | undefined,
  isBatchEnded: false,
  isBatchUpcoming: false,
  contentStatusMap: undefined as Record<string, number> | undefined,
  contentStateFetched: false,
  courseProgressProps: undefined as object | undefined,
  batches: [],
  batchListLoading: false,
  batchListError: undefined as string | undefined,
  firstCertPreviewUrl: undefined as string | undefined,
  hasCertificate: false,
  joinLoading: false,
  joinError: '',
  handleJoinCourse: vi.fn(),
};
vi.mock('@/hooks/useCollectionEnrollment', () => ({
  useCollectionEnrollment: () => mockEnrollment,
}));
vi.mock('@/hooks/useContent', () => ({
  useContentSearch: (opts: { request?: object; enabled?: boolean }) => mockUseContentSearch(opts),
  useContentRead: (id: string) => mockUseContentRead(id),
}));
vi.mock('@/hooks/useQumlContent', () => ({
  useQumlContent: (id: string, opts?: { enabled?: boolean }) => mockUseQumlContent(id, opts),
}));
vi.mock('@/hooks/useContentPlayer', () => ({
  useContentPlayer: () => ({
    handlePlayerEvent: vi.fn(),
    handleTelemetryEvent: vi.fn(),
  }),
}));
vi.mock('@/hooks/useCollectionAutoNavigate', () => ({
  useCollectionAutoNavigate: () => ({ initialExpandedSet: { current: false } }),
}));
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [{ code: 'en', label: 'English' }],
    currentCode: 'en',
    changeLanguage: vi.fn(),
  }),
}));
vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: { data: { response: { firstName: 'Test', lastName: 'User' } } },
    isLoading: false,
    error: null,
  }),
}));
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  };
});
vi.mock('@/components/home/Header', () => ({ default: () => <header data-testid="header">Header</header> }));
vi.mock('@/components/home/Footer', () => ({ default: () => <footer data-testid="footer">Footer</footer> }));
vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message, error }: { message?: string; error?: string }) => (
    <div data-testid="page-loader">{message || error}</div>
  ),
}));
vi.mock('@/components/collection/CollectionOverview', () => ({
  default: ({
    collectionData,
    contentId,
    contentAccessBlocked,
    upcomingBatchBlocked,
    playerIsLoading,
    playerError,
  }: {
    collectionData: { title: string };
    contentId?: string;
    contentAccessBlocked?: boolean;
    upcomingBatchBlocked?: boolean;
    playerIsLoading?: boolean;
    playerError?: Error | null;
  }) => (
    <div
      data-testid="collection-overview"
      data-content-id={contentId ?? ''}
      data-content-access-blocked={String(!!contentAccessBlocked)}
      data-upcoming-blocked={String(!!upcomingBatchBlocked)}
      data-player-loading={String(!!playerIsLoading)}
      data-player-error={playerError?.message ?? ''}
    >
      {collectionData.title}
    </div>
  ),
}));
vi.mock('@/hooks/usePermission', () => ({
  usePermissions: vi.fn(),
}));
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    isUserAuthenticated: vi.fn(() => false),
    getUserId: vi.fn(() => undefined),
    getAuthInfo: vi.fn(() =>
      Promise.resolve({ sid: '', uid: null, isAuthenticated: false }),
    ),
  },
}));
vi.mock('@/components/collection/CollectionSidebar', () => ({
  default: ({ collectionId, contentBlocked, activeContentId }: { collectionId: string; contentBlocked?: boolean; activeContentId?: string | null }) => (
    <aside data-testid="collection-sidebar" data-content-blocked={String(!!contentBlocked)} data-collection-id={collectionId} data-active-lesson-id={activeContentId ?? ''}>Sidebar</aside>
  ),
}));
vi.mock('@/components/landing/FAQSection', () => ({ default: () => <section data-testid="faq">FAQ</section> }));

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/collection/col-123/content/l1']}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const makePermissions = (isAuthenticated: boolean) => ({
  isAuthenticated,
  isLoading: false,
  roles: ['PUBLIC' as const],
  error: null,
  hasAnyRole: vi.fn(),
  canAccessFeature: vi.fn(),
  refetch: vi.fn(),
});

describe('CollectionDetailPage - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: 'l1' });
    vi.mocked(usePermissions).mockReturnValue(makePermissions(false));
    vi.mocked(userAuthInfoService.isUserAuthenticated).mockReturnValue(false);
    mockUseCollection.mockReturnValue({ data: mockCollectionData, isLoading: false });
    mockUseContentSearch.mockReturnValue({ data: { data: { content: [] } }, isLoading: false });
    mockUseContentRead.mockReturnValue({ data: null, isLoading: false, error: null });
    mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: null });
    mockEnrollment.enrollmentForCollection = undefined;
    mockEnrollment.isEnrolledInCurrentBatch = false;
  });

  it('renders loading state when useCollection isLoading is true', () => {
    mockUseCollection.mockReturnValue({ data: null, isLoading: true });
    renderWithProviders(<CollectionDetailPage />);
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('renders collection content when data is loaded', () => {
    renderWithProviders(<CollectionDetailPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getAllByText('Test Collection').length).toBeGreaterThan(0);
    expect(screen.getByTestId('collection-overview')).toHaveTextContent('Test Collection');
    expect(screen.getByTestId('collection-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
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

  it('calls useContentRead with contentId from URL params', () => {
    renderWithProviders(<CollectionDetailPage />);
    expect(mockUseContentRead).toHaveBeenCalledWith('l1');
  });

  it('passes contentId to CollectionOverview', () => {
    renderWithProviders(<CollectionDetailPage />);
    expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-id', 'l1');
  });

  it('passes playerIsLoading=true to CollectionOverview while content is loading', () => {
    mockUseContentRead.mockReturnValue({ data: null, isLoading: true, error: null });
    renderWithProviders(<CollectionDetailPage />);
    expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-loading', 'true');
  });

  it('passes collectionId and activeContentId to CollectionSidebar', () => {
    renderWithProviders(<CollectionDetailPage />);
    const sidebar = screen.getByTestId('collection-sidebar');
    expect(sidebar).toHaveAttribute('data-collection-id', 'col-123');
    expect(sidebar).toHaveAttribute('data-active-lesson-id', 'l1');
  });

  it('navigates back when go back button is clicked', () => {
    renderWithProviders(<CollectionDetailPage />);
    const goBackBtn = screen.getByRole('button', { name: /button\.goBack/i });
    fireEvent.click(goBackBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/explore");
  });

  it('shows stats row with lessons count', () => {
    renderWithProviders(<CollectionDetailPage />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('does not show related content cards when search returns empty', () => {
    mockUseContentSearch.mockReturnValue({
      data: { data: { content: [] } },
      isLoading: false,
      isError: false,
      isFetching: false,
    });
    renderWithProviders(<CollectionDetailPage />);
    expect(screen.queryByText('Related 1')).not.toBeInTheDocument();
  });

  it('shows related content when search returns results', () => {
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

  describe('Auto-navigation', () => {
    it('auto-navigates to first non-collection lesson when no contentId in URL', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-123/content/l1', { replace: true });
    });

    it('does not auto-navigate when contentId is already present in URL', () => {
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('/content/'),
        expect.anything()
      );
    });

    it('does not auto-navigate when first content is a nested collection', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      const nestedRoot = { identifier: 'col-1', mimeType: 'application/vnd.ekstep.content-collection' as const, children: [{ identifier: 'mod-1', mimeType: 'application/vnd.ekstep.content-collection' as const, children: [{ identifier: 'nested-col', mimeType: 'application/vnd.ekstep.content-collection' as const }] }] };
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, children: [{ identifier: 'mod-1', name: 'Module 1', mimeType: 'application/vnd.ekstep.content-collection', children: [{ identifier: 'nested-col', name: 'Sub Course', mimeType: 'application/vnd.ekstep.content-collection' }] }], hierarchyRoot: nestedRoot },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/content/'), expect.anything());
    });

    it('does not auto-navigate when collection has no children', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      const emptyRoot = { identifier: 'col-1', mimeType: 'application/vnd.ekstep.content-collection' as const, children: [] };
      mockUseCollection.mockReturnValue({ data: { ...mockCollectionData, children: [], hierarchyRoot: emptyRoot }, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/content/'), expect.anything());
    });

    it('does not auto-navigate when first unit has no leaf content', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      const unitNoLeaf = { identifier: 'mod-1', name: 'Module 1', mimeType: 'application/vnd.ekstep.content-collection' as const, children: [] };
      const rootNoLeaf = { identifier: 'col-1', mimeType: 'application/vnd.ekstep.content-collection' as const, children: [{ ...unitNoLeaf }] };
      mockUseCollection.mockReturnValue({ data: { ...mockCollectionData, children: [unitNoLeaf], hierarchyRoot: rootNoLeaf }, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/content/'), expect.anything());
    });

    it('does not auto-navigate when hierarchyRoot has no leaf content', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      mockUseCollection.mockReturnValue({ data: { ...mockCollectionData, children: undefined, hierarchyRoot: { identifier: 'col-1', mimeType: 'application/vnd.ekstep.content-collection' } }, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/content/'), expect.anything());
    });

    it('navigates to first unconsumed content in whole course when unit 1 is all completed (two units)', () => {
      const twoUnitHierarchy = {
        identifier: 'col-1',
        mimeType: 'application/vnd.ekstep.content-collection' as const,
        children: [
          {
            identifier: 'mod-1',
            name: 'Unit 1',
            mimeType: 'application/vnd.ekstep.content-collection' as const,
            children: [
              { identifier: 'l1', name: 'Lesson 1', mimeType: 'video/mp4' },
              { identifier: 'l2', name: 'Lesson 2', mimeType: 'application/pdf' },
            ],
          },
          {
            identifier: 'mod-2',
            name: 'Unit 2',
            mimeType: 'application/vnd.ekstep.content-collection' as const,
            children: [
              { identifier: 'l3', name: 'Lesson 3', mimeType: 'video/mp4' },
              { identifier: 'l4', name: 'Lesson 4', mimeType: 'application/pdf' },
            ],
          },
        ],
      };
      mockUseParams.mockReturnValue({ collectionId: 'col-123', batchId: 'batch-1', contentId: undefined });
      mockUseCollection.mockReturnValue({
        data: {
          ...mockCollectionData,
          children: twoUnitHierarchy.children,
          hierarchyRoot: twoUnitHierarchy,
          trackable: { enabled: 'Yes' },
        },
        isLoading: false,
      });
      vi.mocked(usePermissions).mockReturnValue(makePermissions(true));
      mockEnrollment.enrollmentForCollection = { batchId: 'batch-1' } as { batchId: string };
      mockEnrollment.isEnrolledInCurrentBatch = true;
      mockEnrollment.contentStatusMap = { l1: 2, l2: 2 };
      mockEnrollment.contentStateFetched = true;
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).toHaveBeenCalledWith(
        '/collection/col-123/batch/batch-1/content/l3',
        { replace: true }
      );
    });
  });

  describe('Authentication and Content Blocking', () => {
    it('shows LoginToUnlockCard when collection is trackable and user is not authenticated', () => {
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('login-to-unlock-card')).toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'true');
    });

    it('does not show LoginToUnlockCard when user is authenticated (trackable collection)', () => {
      vi.mocked(usePermissions).mockReturnValue(makePermissions(true));
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('login-to-unlock-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'true');
    });

    it('does not show LoginToUnlockCard when collection is not trackable', () => {
      mockUseCollection.mockReturnValue({ data: mockCollectionData, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('login-to-unlock-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'false');
    });

    it('does not show LoginToUnlockCard when trackable.enabled is "No"', () => {
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'No' } },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('login-to-unlock-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'false');
    });

    it('does not show LoginToUnlockCard when trackable exists but enabled is undefined', () => {
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: {} },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('login-to-unlock-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'false');
    });

    it('shows LoginToUnlockCard when trackable.enabled is "YES" (uppercase) and user not authenticated', () => {
      mockUseCollection.mockReturnValue({ data: { ...mockCollectionData, trackable: { enabled: 'YES' as const } }, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('login-to-unlock-card')).toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'true');
    });
    it('shows LoginToUnlockCard when trackable.enabled is "yes" (lowercase) and user not authenticated', () => {
      mockUseCollection.mockReturnValue({ data: { ...mockCollectionData, trackable: { enabled: 'yes' as const } }, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('login-to-unlock-card')).toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'true');
    });
  });
  describe('Content access blocked (mustJoinToAccessContent)', () => {
    it('passes contentAccessBlocked=true to CollectionOverview when trackable and user not authenticated', () => {
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'true');
    });
    it('passes contentAccessBlocked=true to CollectionOverview when trackable and user not enrolled', () => {
      vi.mocked(usePermissions).mockReturnValue(makePermissions(true));
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: 'l1' });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'true');
    });

    it('passes contentAccessBlocked=false when trackable and user is enrolled', () => {
      vi.mocked(usePermissions).mockReturnValue(makePermissions(true));
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      mockUseParams.mockReturnValue({ collectionId: 'col-123', batchId: 'batch-1', contentId: 'l1' });
      mockEnrollment.enrollmentForCollection = { batchId: 'batch-1' };
      mockEnrollment.isEnrolledInCurrentBatch = true;
      mockEnrollment.isBatchUpcoming = false;
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'false');
    });
    it('passes contentAccessBlocked=false when collection is not trackable', () => {
      mockUseCollection.mockReturnValue({ data: mockCollectionData, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'false');
    });

    it('blocks content when user is enrolled but batch is upcoming', () => {
      vi.mocked(usePermissions).mockReturnValue(makePermissions(true));
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      mockUseParams.mockReturnValue({ collectionId: 'col-123', batchId: 'batch-1', contentId: 'l1' });
      mockEnrollment.enrollmentForCollection = { batchId: 'batch-1' };
      mockEnrollment.isEnrolledInCurrentBatch = true;
      mockEnrollment.isBatchUpcoming = true;

      renderWithProviders(<CollectionDetailPage />);

      const overview = screen.getByTestId('collection-overview');
      expect(overview).toHaveAttribute('data-content-access-blocked', 'false');
      expect(overview).toHaveAttribute('data-upcoming-blocked', 'true');
    });
  });
});
