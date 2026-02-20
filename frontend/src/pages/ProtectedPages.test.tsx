import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdminPage from './admin/AdminPage';
import WorkspacePage from './workspace/WorkspacePage';
import ReportsPage from './reports/ReportsPage';
import CreateContentPage from './content/CreateContentPage';

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
  describe('AdminPage', () => {
    it('should render admin dashboard', () => {
      render(<AdminPage />);
      expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
      expect(screen.getByText(/only accessible to users with the/i)).toBeInTheDocument();
    });
  });

  describe('WorkspacePage', () => {
    it('should render workspace', () => {
      renderWithProviders(<WorkspacePage />);
      expect(screen.getByRole('button', { name: 'All 0' })).toBeInTheDocument();
    });
  });

  describe('ReportsPage', () => {
    it('should render reports', () => {
      render(<ReportsPage />);
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
      expect(screen.getByText(/only accessible to users with the/i)).toBeInTheDocument();
    });
  });

  describe('CreateContentPage', () => {
    it('should render create content page', () => {
      render(<CreateContentPage />);
      expect(screen.getByRole('heading', { name: 'Create Content' })).toBeInTheDocument();
      expect(screen.getByText(/only accessible to users with the/i)).toBeInTheDocument();
    });
  });
});
