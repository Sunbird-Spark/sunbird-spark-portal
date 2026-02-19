import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import WorkspacePage from './WorkspacePage';
import type { UseWorkspaceReturn } from '@/types/workspaceTypes';

const { mockNavigate, mockContentCreate, mockQuestionSetMutateAsync } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockContentCreate: vi.fn(),
  mockQuestionSetMutateAsync: vi.fn(),
}));

const mockUseWorkspace = vi.fn<() => UseWorkspaceReturn>();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/ContentService', () => ({
  ContentService: class MockContentService {
    contentCreate(...args: unknown[]) {
      return mockContentCreate(...args);
    }
    contentRetire = vi.fn();
  },
}));

vi.mock('@/hooks/useWorkspace', () => ({
  useWorkspace: (...args: unknown[]) => mockUseWorkspace(),
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: {
      data: {
        response: {
          firstName: 'Test',
          lastName: 'User',
          roles: [{ role: 'CONTENT_CREATOR' }],
        },
      },
    },
  }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => ({ data: undefined }),
}));

vi.mock('@/hooks/useOrganization', () => ({
  useOrganizationSearch: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useQuestionSetCreate', () => ({
  useQuestionSetCreate: () => ({ mutateAsync: mockQuestionSetMutateAsync }),
}));

vi.mock('@/hooks/useChannel', () => ({
  useChannel: () => ({ data: undefined }),
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

const mockToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [{ code: 'en', label: 'English' }],
    currentCode: 'en',
    changeLanguage: vi.fn(),
  }),
}));

const mockUseIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock('@/components/home/HomeSidebar', () => ({
  default: ({ onNavChange }: { onNavChange: (n: string) => void }) => (
    <div data-testid="sidebar">
      <button type="button" onClick={() => onNavChange('workspace')}>
        Workspace
      </button>
    </div>
  ),
}));

vi.mock('@/components/home/Footer', () => ({ default: () => <footer data-testid="footer">Footer</footer> }));

vi.mock('@/components/common/PageLoader', () => ({ default: ({ message }: { message: string }) => <div>{message}</div> }));

vi.mock('@/components/workspace/WorkspaceToolbar', () => ({
  default: ({
    onCreateClick,
    onViewChange,
  }: {
    onCreateClick: () => void;
    onViewChange: (v: string) => void;
  }) => (
    <div data-testid="segmented-control">
      <button type="button" onClick={onCreateClick}>
        createNew
      </button>
      <button type="button" onClick={() => onViewChange('all')}>
        All 0
      </button>
      <button type="button" onClick={() => onViewChange('drafts')}>
        Drafts 0
      </button>
      <button type="button" onClick={() => onViewChange('uploads')}>
        Uploads
      </button>
      <button type="button" onClick={() => onViewChange('collaborations')}>
        Collaborations
      </button>
      <button type="button" onClick={() => onViewChange('create')}>
        Create view
      </button>
    </div>
  ),
}));

vi.mock('@/components/home/Sheet', () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('WorkspacePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockContentCreate.mockReset();
    mockContentCreate.mockResolvedValue({ data: { identifier: 'do_qs_123' } });

    mockUseIsMobile.mockReturnValue(false);
    mockUseWorkspace.mockReturnValue({
      contents: [],
      counts: { all: 0, drafts: 0, review: 0, published: 0, pendingReview: 0 },
      totalCount: 0,
      isLoading: false,
      isLoadingMore: false,
      isCountsLoading: false,
      isRefreshing: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refetchCounts: vi.fn().mockResolvedValue(undefined),
      refetchAll: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace with header, sidebar, and segment control', () => {
    renderWithProviders(<WorkspacePage />);
    expect(screen.getByRole('button', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByTestId('segmented-control')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('shows loading state when isLoading and isCountsLoading are true', () => {
    mockUseWorkspace.mockReturnValue({
      contents: [],
      counts: { all: 0, drafts: 0, review: 0, published: 0, pendingReview: 0 },
      totalCount: 0,
      isLoading: true,
      isLoadingMore: false,
      isCountsLoading: true,
      isRefreshing: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refetchCounts: vi.fn().mockResolvedValue(undefined),
      refetchAll: vi.fn().mockResolvedValue(undefined),
    });
    renderWithProviders(<WorkspacePage />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', async () => {
    renderWithProviders(<WorkspacePage />);
    const createBtn = screen.getByRole('button', { name: 'createNew' });
    fireEvent.click(createBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no items', () => {
    renderWithProviders(<WorkspacePage />);
    expect(screen.getByTestId('segmented-control')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All 0' })).toBeInTheDocument();
  });

  it('renders mobile layout with sheet when isMobile is true', () => {
    mockUseIsMobile.mockReturnValue(true);
    renderWithProviders(<WorkspacePage />);
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('closes create modal when close button is clicked', async () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Create content' })).not.toBeInTheDocument();
    });
  });

  it('opens name dialog when a create option is selected', async () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    const courseOption = within(dialog).getByRole('button', { name: /Course/ });
    fireEvent.click(courseOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Enter content name' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog', { name: 'Create content' })).not.toBeInTheDocument();
  });

  it('shows uploads empty state when Uploads view is selected', () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Uploads' }));
    expect(screen.getByText('noUploadsYet')).toBeInTheDocument();
    expect(screen.getByText('uploadHere')).toBeInTheDocument();
  });

  it('shows collaborations empty state when Collaborations view is selected', () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Collaborations' }));
    expect(screen.getByText('noCollaborations')).toBeInTheDocument();
    expect(screen.getByText('sharedWithYou')).toBeInTheDocument();
  });

  it('shows create options in main content when Create view is selected', () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Create view' }));
    expect(screen.getByText('Collection Editor')).toBeInTheDocument();
  });

  it('creates question set from create options and navigates to quml editor', async () => {
    mockQuestionSetMutateAsync.mockResolvedValue({ identifier: 'do_qs_123' });
    renderWithProviders(<WorkspacePage />);

    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Question Set/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Enter content name' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Untitled Content'), {
      target: { value: 'My Question Set' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockQuestionSetMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Question Set',
          createdBy: 'test-user-id',
        }),
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/edit/quml-editor/do_qs_123');
    });
  });
});
