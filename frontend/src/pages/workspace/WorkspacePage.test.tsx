import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import WorkspacePage from './WorkspacePage';

vi.mock('@/hooks/useContent', () => ({
  useContentSearch: vi.fn(() => ({
    data: { data: { content: [], QuestionSet: [] } },
    isLoading: false,
    refetch: vi.fn(),
  })),
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
  beforeEach(async () => {
    mockUseIsMobile.mockReturnValue(false);
    const { useContentSearch } = await import('@/hooks/useContent');
    vi.mocked(useContentSearch).mockReturnValue({
      data: { data: { content: [], QuestionSet: [] } },
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useContentSearch>);
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

  it('shows loading state when useContentSearch isLoading is true', async () => {
    const { useContentSearch } = await import('@/hooks/useContent');
    vi.mocked(useContentSearch).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useContentSearch>);
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
    expect(screen.getByRole('button', { name: 'Open Menu' })).toBeInTheDocument();
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

  it('calls handleCreateOption and closes modal when an option is selected', async () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    const courseOption = within(dialog).getByRole('button', { name: /Course/ });
    fireEvent.click(courseOption);
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Starting Editor',
          description: expect.stringContaining('course'),
        })
      );
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
});
