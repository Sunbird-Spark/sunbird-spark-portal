import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
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
vi.mock('@/auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: { isUserAuthenticated: vi.fn(() => false) },
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

describe('CollectionDetailPage - QUML Content & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ collectionId: 'col-123', contentId: 'l1' });
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(userAuthInfoService.isUserAuthenticated).mockReturnValue(false);
    mockUseCollection.mockReturnValue({ data: mockCollectionData, isLoading: false });
    mockUseContentSearch.mockReturnValue({ data: { data: { content: [] } }, isLoading: false });
    mockUseContentRead.mockReturnValue({ data: null, isLoading: false, error: null });
    mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: null });
  });

  describe('QUML content handling', () => {
    it('calls useQumlContent with enabled: true when content has questionset mimeType', () => {
      const questionSetContent = {
        data: {
          content: {
            identifier: 'q1',
            name: 'Question Set',
            mimeType: 'application/vnd.sunbird.questionset',
          },
        },
      };
      mockUseContentRead.mockReturnValue({ data: questionSetContent, isLoading: false, error: null });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockUseQumlContent).toHaveBeenCalledWith('l1', { enabled: true });
    });

    it('calls useQumlContent with enabled: true when content has question mimeType', () => {
      const questionContent = {
        data: {
          content: {
            identifier: 'q2',
            name: 'Single Question',
            mimeType: 'application/vnd.sunbird.question',
          },
        },
      };
      mockUseContentRead.mockReturnValue({ data: questionContent, isLoading: false, error: null });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockUseQumlContent).toHaveBeenCalledWith('l1', { enabled: true });
    });

    it('calls useQumlContent with enabled: false when content is not QUML', () => {
      const videoContent = {
        data: {
          content: {
            identifier: 'v1',
            name: 'Video Content',
            mimeType: 'video/mp4',
          },
        },
      };
      mockUseContentRead.mockReturnValue({ data: videoContent, isLoading: false, error: null });
      renderWithProviders(<CollectionDetailPage />);
      expect(mockUseQumlContent).toHaveBeenCalledWith('l1', { enabled: false });
    });

    it('uses qumlData as playerMetadata when content is QUML', () => {
      const questionSetContent = {
        data: {
          content: {
            identifier: 'q1',
            name: 'Question Set',
            mimeType: 'application/vnd.sunbird.questionset',
          },
        },
      };
      const qumlMetadata = {
        identifier: 'q1',
        name: 'Question Set',
        mimeType: 'application/vnd.sunbird.questionset',
        children: [{ identifier: 'q1-1', body: 'Question 1' }],
      };
      mockUseContentRead.mockReturnValue({ data: questionSetContent, isLoading: false, error: null });
      mockUseQumlContent.mockReturnValue({ data: qumlMetadata, isLoading: false, error: null });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toBeInTheDocument();
    });

    it('shows loading state when QUML content is loading', () => {
      const questionSetContent = {
        data: {
          content: {
            identifier: 'q1',
            name: 'Question Set',
            mimeType: 'application/vnd.sunbird.questionset',
          },
        },
      };
      mockUseContentRead.mockReturnValue({ data: questionSetContent, isLoading: false, error: null });
      mockUseQumlContent.mockReturnValue({ data: null, isLoading: true, error: null });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-loading', 'true');
    });

    it('uses selectedContentData as playerMetadata when content is not QUML', () => {
      const videoContent = {
        data: {
          content: {
            identifier: 'v1',
            name: 'Video Content',
            mimeType: 'video/mp4',
            artifactUrl: 'https://example.com/video.mp4',
          },
        },
      };
      mockUseContentRead.mockReturnValue({ data: videoContent, isLoading: false, error: null });
      mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: null });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('passes contentError to CollectionOverview when non-QUML content fails to load', () => {
      const error = new Error('Failed to load content');
      mockUseContentRead.mockReturnValue({ data: null, isLoading: false, error });
      mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: null });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-error', 'Failed to load content');
    });

    it('passes qumlError to CollectionOverview when QUML content fails to load', () => {
      const questionSetContent = {
        data: {
          content: {
            identifier: 'q1',
            name: 'Question Set',
            mimeType: 'application/vnd.sunbird.questionset',
          },
        },
      };
      const qumlError = new Error('Failed to load QUML data');
      mockUseContentRead.mockReturnValue({ data: questionSetContent, isLoading: false, error: null });
      mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: qumlError });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-error', 'Failed to load QUML data');
    });

    it('prioritizes qumlError over contentError when content is QUML', () => {
      const questionSetContent = {
        data: {
          content: {
            identifier: 'q1',
            name: 'Question Set',
            mimeType: 'application/vnd.sunbird.questionset',
          },
        },
      };
      const contentError = new Error('Content error');
      const qumlError = new Error('QUML error');
      mockUseContentRead.mockReturnValue({ data: questionSetContent, isLoading: false, error: contentError });
      mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: qumlError });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-error', 'QUML error');
    });

    it('passes null playerError when no error occurs', () => {
      const videoContent = {
        data: {
          content: {
            identifier: 'v1',
            name: 'Video Content',
            mimeType: 'video/mp4',
            artifactUrl: 'https://example.com/video.mp4',
          },
        },
      };
      mockUseContentRead.mockReturnValue({ data: videoContent, isLoading: false, error: null });
      mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: null });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-error', '');
    });

    it('does not show loading when error occurs for QUML content', () => {
      const questionSetContent = {
        data: {
          content: {
            identifier: 'q1',
            name: 'Question Set',
            mimeType: 'application/vnd.sunbird.questionset',
          },
        },
      };
      const qumlError = new Error('Failed to load QUML data');
      mockUseContentRead.mockReturnValue({ data: questionSetContent, isLoading: false, error: null });
      mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: qumlError });
      
      renderWithProviders(<CollectionDetailPage />);
      
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-loading', 'false');
      expect(screen.getByTestId('collection-overview')).toHaveAttribute('data-player-error', 'Failed to load QUML data');
    });
  });
});
