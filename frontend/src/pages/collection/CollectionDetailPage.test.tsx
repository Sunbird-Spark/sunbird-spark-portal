import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
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
        { id: 'l1', title: 'Lesson 1', duration: '5:00', type: 'video' as const },
        { id: 'l2', title: 'Lesson 2', duration: '—', type: 'document' as const },
      ],
    },
  ],
};

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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ collectionId: 'col-123' }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/components/home/Header', () => ({ default: () => <header data-testid="header">Header</header> }));
vi.mock('@/components/home/Footer', () => ({ default: () => <footer data-testid="footer">Footer</footer> }));
vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="page-loader">{message}</div>,
}));
vi.mock('@/components/collection/CollectionOverview', () => ({
  default: ({ collectionData }: { collectionData: { title: string } }) => (
    <div data-testid="collection-overview">{collectionData.title}</div>
  ),
}));
vi.mock('@/components/collection/CollectionSidebar', () => ({
  default: () => <aside data-testid="collection-sidebar">Sidebar</aside>,
}));
vi.mock('@/components/landing/FAQSection', () => ({ default: () => <section data-testid="faq">FAQ</section> }));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/course/col-123']}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CollectionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCollection.mockReturnValue({
      data: mockCollectionData,
      isLoading: false,
    });
    mockUseContentSearch.mockReturnValue({
      data: { data: { content: [] } },
      isLoading: false,
    });
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
      expect.objectContaining({
        request: { limit: 20, offset: 0 },
        enabled: true,
      })
    );
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
});
