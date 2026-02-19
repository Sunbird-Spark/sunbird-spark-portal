import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CollectionDetailPage from './CollectionDetailPage';

/* ── Collection / content data ── */
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
        { id: 'l1', title: 'Lesson 1', duration: '5:00', type: 'video' as const },
        { id: 'l2', title: 'Lesson 2', duration: '—', type: 'document' as const },
      ],
    },
  ],
};

/* ── Data hooks ── */
const mockUseCollection = vi.fn();
const mockUseContentSearch = vi.fn();
vi.mock('@/hooks/useCollection', () => ({
  useCollection: (id: string | undefined) => mockUseCollection(id),
}));
vi.mock('@/hooks/useContent', () => ({
  useContentSearch: (opts: { request?: object; enabled?: boolean }) => mockUseContentSearch(opts),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [{ code: 'en', label: 'English' }],
    currentCode: 'en',
    changeLanguage: vi.fn(),
  }),
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
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuthState.isAuthenticated }),
}));
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: { isUserAuthenticated: () => false },
}));

/* ── useIsContentCreator (mutable) ── */
let mockIsContentCreator = false;
vi.mock('@/hooks/useUser', () => ({
  useIsContentCreator: () => mockIsContentCreator,
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

    it('renders BatchCard when user IS authenticated AND useIsContentCreator returns true', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = true;
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('batch-card')).toBeInTheDocument();
    });

    it('does NOT render BatchCard when authenticated but useIsContentCreator returns false', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = false;
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
      renderWithProviders(<CollectionDetailPage />);
      expect(screen.getByTestId('batch-card')).toHaveAttribute('data-collection-id', 'col-123');
    });
  });

  /* ─── BatchCard — position in sidebar ─── */
  describe('BatchCard DOM position', () => {
    it('renders BatchCard BEFORE CollectionSidebar in the DOM', () => {
      mockAuthState.isAuthenticated = true;
      mockIsContentCreator = true;
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
      renderWithProviders(<CollectionDetailPage />);

      const batchCard = screen.getByTestId('batch-card');
      const sidebar = screen.getByTestId('collection-sidebar');

      expect(batchCard.parentElement?.parentElement).toBe(
        sidebar.parentElement
      );
    });
  });
});
