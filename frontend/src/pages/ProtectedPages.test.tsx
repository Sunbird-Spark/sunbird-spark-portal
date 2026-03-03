import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import WorkspacePage from './workspace/WorkspacePage';
import ReportsPage from './reports/ReportsPage';
import CreateContentPage from './content/CreateContentPage';

// Mock react-i18next to handle Trans component
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));

vi.mock('@/hooks/useContent', () => ({
  useContentSearch: vi.fn(() => ({
    data: { data: { content: [], QuestionSet: [] } },
    isLoading: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: 'Test User', role: 'content_creator' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: () => 'test-user-id',
    isUserAuthenticated: () => true,
  },
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: { data: { response: { firstName: 'Test', lastName: 'User' } } },
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/useSidebarState', () => ({
  useSidebarState: () => ({
    isOpen: true,
    setSidebarOpen: vi.fn(),
    toggleSidebar: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [],
    currentCode: 'en',
    changeLanguage: vi.fn(),
  }),
}));

vi.mock('@/hooks/useWorkspace', () => ({
  useWorkspace: () => ({
    contents: [],
    counts: { total: 0, draft: 0, review: 0, published: 0, all: 0 },
    totalCount: 0,
    isLoading: false,
    isLoadingMore: false,
    isCountsLoading: false,
    error: null,
    hasMore: false,
    loadMore: vi.fn(),
    refetchCounts: vi.fn(),
    refetchAll: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => ({ data: null }),
}));

vi.mock('@/hooks/useOrganization', () => ({
  useOrganizationSearch: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useChannel', () => ({
  useChannel: () => ({ data: null }),
}));

vi.mock('@/hooks/useQuestionSetCreate', () => ({
  useQuestionSetCreate: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useQuestionSetRetire', () => ({
  useQuestionSetRetire: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/services/LockService', () => ({
  lockService: { listLocks: vi.fn().mockResolvedValue({ data: { data: [] } }) },
  LockService: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Protected Pages', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('WorkspacePage', () => {
    it('should render workspace', { timeout: 10000 }, () => {
      renderWithProviders(<WorkspacePage />);
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  describe('ReportsPage', () => {
    it('should render reports', () => {
      render(
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      );
      expect(screen.getByRole('heading', { name: 'reports.title' })).toBeInTheDocument();
      expect(screen.getByText(/reports.accessInfo/i)).toBeInTheDocument();
    });
  });

  describe('CreateContentPage', () => {
    it('should render create content page', () => {
      render(
        <MemoryRouter>
          <CreateContentPage />
        </MemoryRouter>
      );
      expect(screen.getByRole('heading', { name: 'createContent' })).toBeInTheDocument();
      // This page still uses the old key pattern presumably, or checks generic access
      expect(screen.getByText(/content.accessRestricted/i)).toBeInTheDocument();
    });
  });
});
