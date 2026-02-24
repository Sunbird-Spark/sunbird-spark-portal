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
  modules: [
    {
      id: 'mod-1',
      title: 'Module 1',
      subtitle: 'Subtitle',
      lessons: [
        { id: 'l1', title: 'Lesson 1', duration: '5:00', type: 'video' as const, mimeType: 'video/mp4' },
        { id: 'l2', title: 'Lesson 2', duration: '—', type: 'document' as const, mimeType: 'application/pdf' },
      ],
    },
  ],
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
  contentStatusMap: undefined as Record<string, number> | undefined,
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
    playerIsLoading,
    playerError,
  }: {
    collectionData: { title: string };
    contentId?: string;
    contentAccessBlocked?: boolean;
    playerIsLoading?: boolean;
    playerError?: Error | null;
  }) => (
    <div
      data-testid="collection-overview"
      data-content-id={contentId ?? ''}
      data-content-access-blocked={String(!!contentAccessBlocked)}
      data-player-loading={String(!!playerIsLoading)}
      data-player-error={playerError?.message ?? ''}
    >
      {collectionData.title}
    </div>
  ),
}));
vi.mock('@/hooks/usePermission', () => ({
  usePermissions: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    roles: ['GUEST'],
    primaryRole: 'GUEST',
    error: null,
    hasRole: vi.fn(),
    hasAnyRole: vi.fn(),
    hasAllRoles: vi.fn(),
    canAccessRoute: vi.fn(),
    canAccessFeature: vi.fn(),
    getDefaultRoute: vi.fn(),
    refetch: vi.fn(),
  })),
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
  default: ({
    collectionId,
    contentBlocked,
    activeLessonId,
  }: {
    collectionId: string;
    contentBlocked?: boolean;
    activeLessonId?: string;
  }) => (
    <aside
      data-testid="collection-sidebar"
      data-content-blocked={String(!!contentBlocked)}
      data-collection-id={collectionId}
      data-active-lesson-id={activeLessonId ?? ''}
    >
      Sidebar
    </aside>
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

describe('CollectionDetailPage - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: 'l1' });
    vi.mocked(usePermissions).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      roles: ['GUEST'],
      primaryRole: 'GUEST',
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
      canAccessRoute: vi.fn(),
      canAccessFeature: vi.fn(),
      getDefaultRoute: vi.fn(),
      refetch: vi.fn(),
    });
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

  it('passes collectionId and activeLessonId to CollectionSidebar', () => {
    renderWithProviders(<CollectionDetailPage />);
    const sidebar = screen.getByTestId('collection-sidebar');
    expect(sidebar).toHaveAttribute('data-collection-id', 'col-123');
    expect(sidebar).toHaveAttribute('data-active-lesson-id', 'l1');
  });

  it('navigates back when go back button is clicked', () => {
    renderWithProviders(<CollectionDetailPage />);
    const goBackBtn = screen.getByRole('button', { name: /button\.goBack/i });
    fireEvent.click(goBackBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
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

    it('does not auto-navigate when first lesson is a nested collection', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      mockUseCollection.mockReturnValue({
        data: {
          ...mockCollectionData,
          modules: [{
            id: 'mod-1',
            title: 'Module 1',
            subtitle: 'Subtitle',
            lessons: [{ id: 'nested-col', title: 'Sub Course', duration: '—', type: 'document' as const, mimeType: 'application/vnd.ekstep.content-collection' }],
          }],
        },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('/content/'),
        expect.anything()
      );
    });

    it('does not auto-navigate when collection has no modules', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      mockUseCollection.mockReturnValue({
        data: {
          ...mockCollectionData,
          modules: [],
        },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('/content/'),
        expect.anything()
      );
    });

    it('does not auto-navigate when first module has no lessons', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      mockUseCollection.mockReturnValue({
        data: {
          ...mockCollectionData,
          modules: [{
            id: 'mod-1',
            title: 'Module 1',
            subtitle: 'Subtitle',
            lessons: [],
          }],
        },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('/content/'),
        expect.anything()
      );
    });

    it('does not auto-navigate when modules is undefined', () => {
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: undefined });
      mockUseCollection.mockReturnValue({
        data: {
          ...mockCollectionData,
          modules: undefined,
        },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('/content/'),
        expect.anything()
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
      vi.mocked(usePermissions).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        roles: ['GUEST'],
        primaryRole: 'GUEST',
        error: null,
        hasRole: vi.fn(),
        hasAnyRole: vi.fn(),
        hasAllRoles: vi.fn(),
        canAccessRoute: vi.fn(),
        canAccessFeature: vi.fn(),
        getDefaultRoute: vi.fn(),
        refetch: vi.fn(),
      });
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.queryByTestId('login-to-unlock-card')).not.toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'false');
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
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'YES' as const } },
        isLoading: false,
      });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('login-to-unlock-card')).toBeInTheDocument();
      expect(screen.getByTestId('collection-sidebar')).toHaveAttribute('data-content-blocked', 'true');
    });

    it('shows LoginToUnlockCard when trackable.enabled is "yes" (lowercase) and user not authenticated', () => {
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'yes' as const } },
        isLoading: false,
      });
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
      vi.mocked(usePermissions).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        roles: ['GUEST'],
        primaryRole: 'GUEST',
        error: null,
        hasRole: vi.fn(),
        hasAnyRole: vi.fn(),
        hasAllRoles: vi.fn(),
        canAccessRoute: vi.fn(),
        canAccessFeature: vi.fn(),
        getDefaultRoute: vi.fn(),
        refetch: vi.fn(),
      });
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: 'l1' });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'true');
    });

    it('passes contentAccessBlocked=false when trackable and user is enrolled', () => {
      vi.mocked(usePermissions).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        roles: ['GUEST'],
        primaryRole: 'GUEST',
        error: null,
        hasRole: vi.fn(),
        hasAnyRole: vi.fn(),
        hasAllRoles: vi.fn(),
        canAccessRoute: vi.fn(),
        canAccessFeature: vi.fn(),
        getDefaultRoute: vi.fn(),
        refetch: vi.fn(),
      });
      mockUseCollection.mockReturnValue({
        data: { ...mockCollectionData, trackable: { enabled: 'Yes' } },
        isLoading: false,
      });
      mockUseParams.mockReturnValue({ collectionId: 'col-123', batchId: 'batch-1', contentId: 'l1' });
      mockEnrollment.enrollmentForCollection = { batchId: 'batch-1' };
      mockEnrollment.isEnrolledInCurrentBatch = true;
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'false');
    });
    it('passes contentAccessBlocked=false when collection is not trackable', () => {
      mockUseCollection.mockReturnValue({ data: mockCollectionData, isLoading: false });
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-content-access-blocked', 'false');
    });
  });
});
