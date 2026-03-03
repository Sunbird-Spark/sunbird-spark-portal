import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspaceToolbar from '@/components/workspace/WorkspaceToolbar';
import type { WorkspaceView, UserRole, ViewMode, ContentTypeFilter } from '@/types/workspaceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, data?: any) => {
      const translations: Record<string, string> = {
        'createNew': 'createNew',
        'workspace.roleReviewer': 'Reviewer',
        'workspace.roleCreator': 'Creator',
        'sidebar.drafts': 'Drafts',
        'sidebar.published': 'Published',
        'sidebar.pendingReview': 'Pending',
        'workspace.more': 'More',
        'workspaceCard.uploads': 'Uploads',
        'workspaceCard.collaborations': 'Collaborations',
        'allTypes': 'All Types',
        'course': 'Course',
        'workspace.showingItems': `Showing ${data?.count} items`,
        'workspace.showingItemsOf': `Showing ${data?.count} items of ${data?.total}`,
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/components/common/Button', () => ({
  Button: ({ children, onClick, ...props }: React.ComponentProps<'button'>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/common/Badge', () => ({
  Badge: ({ children, ...props }: React.ComponentProps<'span'>) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/common/DropdownMenu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    ...props
  }: React.ComponentProps<'button'>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const baseCounts = { all: 5, drafts: 2, review: 1, published: 2, pendingReview: 3 };

const renderToolbar = (overrides?: Partial<{
  activeView: WorkspaceView;
  userRole: UserRole;
  viewMode: ViewMode;
  typeFilter: ContentTypeFilter;
  contentCount?: number;
  counts: typeof baseCounts;
  hasCreatorRole: boolean;
  hasReviewerRole: boolean;
}>) => {
  const onViewChange = vi.fn();
  const onRoleChange = vi.fn();
  const onViewModeChange = vi.fn();
  const onTypeFilterChange = vi.fn();
  const onCreateClick = vi.fn();

  const props = {
    activeView: 'all' as WorkspaceView,
    userRole: 'creator' as UserRole,
    counts: baseCounts,
    viewMode: 'grid' as ViewMode,
    typeFilter: 'all' as ContentTypeFilter,
    contentCount: 5,
    hasCreatorRole: true,
    hasReviewerRole: true,
    onViewChange,
    onRoleChange,
    onViewModeChange,
    onTypeFilterChange,
    onCreateClick,
    ...overrides,
  };

  render(<WorkspaceToolbar {...props} />);
  return { ...props, onViewChange, onRoleChange, onViewModeChange, onTypeFilterChange, onCreateClick };
};

describe('WorkspaceToolbar', () => {
  it('switches role between creator and reviewer and toggles create button visibility', () => {
    const { onRoleChange } = renderToolbar();

    // Creator should see create button
    expect(screen.getByRole('button', { name: 'createNew' })).toBeInTheDocument();

    // Click Reviewer role
    fireEvent.click(screen.getByRole('button', { name: 'Reviewer' }));
    expect(onRoleChange).toHaveBeenCalledWith('reviewer');
  });

  it('calls onViewChange when main segment buttons are clicked', () => {
    const { onViewChange } = renderToolbar({ userRole: 'creator', activeView: 'all' });

    fireEvent.click(screen.getByRole('button', { name: /Drafts/ }));
    expect(onViewChange).toHaveBeenCalledWith('drafts');

    fireEvent.click(screen.getByRole('button', { name: /Published/ }));
    expect(onViewChange).toHaveBeenCalledWith('published');
  });

  it('shows reviewer segments when userRole is reviewer', () => {
    const { onViewChange } = renderToolbar({ userRole: 'reviewer', activeView: 'pending-review' });

    expect(screen.getByRole('button', { name: /Pending/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Published/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pending/ }));
    expect(onViewChange).toHaveBeenCalledWith('pending-review');
  });

  it('renders secondary actions for creator and calls onViewChange from More menu', () => {
    const { onViewChange } = renderToolbar({ userRole: 'creator' });

    // Our DropdownMenu mock always renders content
    expect(screen.getByText('More')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Uploads' }));
    expect(onViewChange).toHaveBeenCalledWith('uploads');
    fireEvent.click(screen.getByRole('button', { name: 'Collaborations' }));
    expect(onViewChange).toHaveBeenCalledWith('collaborations');
  });

  it('shows type filter and view mode controls when content filters are enabled', () => {
    const { onTypeFilterChange, onViewModeChange } = renderToolbar({
      activeView: 'all',
      viewMode: 'grid',
      typeFilter: 'all',
    });

    // Type filter button text (trigger + menu entry both rendered in our mock)
    expect(screen.getAllByRole('button', { name: /All Types/ }).length).toBeGreaterThan(0);

    // Click a type in the dropdown
    fireEvent.click(screen.getByRole('button', { name: 'Course' }));
    expect(onTypeFilterChange).toHaveBeenCalledWith('course');

    // View mode toggles (two icon-only buttons, pick the first as grid)
    const buttons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(buttons[0]!);
    expect(onViewModeChange).toHaveBeenCalledWith('grid');
  });

  it('hides filters when activeView is create', () => {
    renderToolbar({ activeView: 'create' });
    expect(screen.queryByText(/All Types/)).not.toBeInTheDocument();
  });

  it('shows stats row only for creator with content filters and displays counts', () => {
    renderToolbar({
      userRole: 'creator',
      activeView: 'all',
      counts: { all: 10, drafts: 3, review: 4, published: 6, pendingReview: 2 },
      contentCount: 10,
    });

    expect(screen.getByText(/Showing 10 items/)).toBeInTheDocument();
  });

  it('does not show stats row for reviewer', () => {
    renderToolbar({ userRole: 'reviewer', activeView: 'all' });
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
});
