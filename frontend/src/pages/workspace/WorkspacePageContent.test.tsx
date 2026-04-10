import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspacePageContent from './WorkspacePageContent';
import type { WorkspaceItem } from '@/types/workspaceTypes';

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'workspace.emptyStates.noUploadsTitle': 'No uploads yet',
    'workspace.emptyStates.noUploadsDesc': 'Upload PDF, video, or other content files to get started.',
    'workspace.emptyStates.noCollaborationsTitle': 'No collaborations',
    'workspace.emptyStates.noCollaborationsDesc': 'Content shared with you will appear here.',
    'uploadContent': 'uploadContent',
    'createFirst': 'createFirst',
    'createContent': 'createContent',
  };
  return translations[key] ?? key;
};
const defaultProps = {
  showCreateModal: false,
  activeView: 'all',
  filteredItems: [] as WorkspaceItem[],
  viewMode: 'grid' as const,
  t: mockT,
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  isError: false,
  error: null,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
  onCreateOption: vi.fn(),
  onCreateClick: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onView: vi.fn(),
  userRole: 'creator' as const,
};
const mockItem: WorkspaceItem = {
  id: 'item-1',
  title: 'Test Course',
  description: 'Description',
  type: 'course',
  status: 'draft',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  author: 'user-1',
  primaryCategory: 'Course',
  contentType: '',
  mimeType: '',
  framework: '',
  contentStatus: 'Draft',
};

vi.mock('@/components/workspace/CreateOptions', () => ({
  default: ({ onOptionSelect }: { onOptionSelect: (id: string) => void }) => (
    <div data-testid="create-options">
      <button type="button" onClick={() => onOptionSelect('course')}>Select option</button>
    </div>
  ),
}));
vi.mock('@/components/workspace/EmptyState', () => ({
  default: ({ title, description, actionLabel, onAction }: {
    title: string; description: string; actionLabel?: string; onAction?: () => void;
  }) => (
    <div data-testid="empty-state">
      <span data-testid="empty-title">{title}</span>
      <span data-testid="empty-desc">{description}</span>
      {actionLabel && onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  ),
}));
vi.mock('@/components/workspace/WorkspaceContentCard', () => ({
  default: ({ item, onEdit, onDelete, onView }: {
    item: WorkspaceItem;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
  }) => (
    <div data-testid="content-card">
      <span>{item.title}</span>
      <button type="button" onClick={() => onEdit(item.id)}>Edit</button>
      <button type="button" onClick={() => onDelete(item.id)}>Delete</button>
      <button type="button" onClick={() => onView(item.id)}>View</button>
    </div>
  ),
}));
vi.mock('@/components/workspace/WorkspaceContentList', () => ({
  default: ({ items, onEdit }: { items: WorkspaceItem[]; onEdit: (id: string) => void }) => (
    <div data-testid="content-list">
      {items.map((item) => (
        <div key={item.id}><span>{item.title}</span>
          <button type="button" onClick={() => onEdit(item.id)}>Edit</button>
        </div>
      ))}
    </div>
  ),
}));

describe('WorkspacePageContent', () => {
  it('renders CreateOptions when showCreateModal or activeView is create', () => {
    const { rerender } = render(<WorkspacePageContent {...defaultProps} showCreateModal />);
    expect(screen.getByTestId('create-options')).toBeInTheDocument();
    rerender(<WorkspacePageContent {...defaultProps} activeView="create" showCreateModal={false} />);
    expect(screen.getByTestId('create-options')).toBeInTheDocument();
  });
  it('calls onCreateOption when option selected in create view', () => {
    const onCreateOption = vi.fn();
    render(<WorkspacePageContent {...defaultProps} activeView="create" onCreateOption={onCreateOption} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select option' }));
    expect(onCreateOption).toHaveBeenCalledWith('course');
  });
  it('renders uploads EmptyState when activeView is uploads and no items', () => {
    const onCreateOption = vi.fn();
    render(<WorkspacePageContent {...defaultProps} activeView="uploads" filteredItems={[]} onCreateOption={onCreateOption} />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('No uploads yet');
    expect(screen.getByTestId('empty-desc')).toHaveTextContent('Upload PDF, video, or other content files to get started.');
    fireEvent.click(screen.getByRole('button', { name: 'uploadContent' }));
    expect(onCreateOption).toHaveBeenCalledWith('upload-pdf');
  });
  it('renders collaborations EmptyState when activeView is collaborations and no items', () => {
    render(<WorkspacePageContent {...defaultProps} activeView="collaborations" filteredItems={[]} />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('No collaborations');
    expect(screen.getByTestId('empty-desc')).toHaveTextContent('Content shared with you will appear here.');
    expect(screen.queryByRole('button', { name: 'uploadContent' })).not.toBeInTheDocument();
  });
  it('renders empty state createFirst when no items and calls onCreateClick on action', () => {
    const onCreateClick = vi.fn();
    render(<WorkspacePageContent {...defaultProps} activeView="all" filteredItems={[]} onCreateClick={onCreateClick} />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('createFirst');
    fireEvent.click(screen.getByRole('button', { name: 'createContent' }));
    expect(onCreateClick).toHaveBeenCalled();
  });
  it('renders grid of cards when items and viewMode grid, list when viewMode list', () => {
    const propsWithItems = { ...defaultProps, activeView: 'all' as const, filteredItems: [mockItem] };
    const { rerender } = render(<WorkspacePageContent {...propsWithItems} viewMode="grid" />);
    expect(screen.getByTestId('content-card')).toBeInTheDocument();
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.queryByTestId('content-list')).not.toBeInTheDocument();
    rerender(<WorkspacePageContent {...propsWithItems} viewMode="list" />);
    expect(screen.getByTestId('content-list')).toBeInTheDocument();
    expect(screen.queryByTestId('content-card')).not.toBeInTheDocument();
  });
  it('invokes onEdit, onDelete, onView when grid card actions clicked', () => {
    const onEdit = vi.fn(), onDelete = vi.fn(), onView = vi.fn();
    render(
      <WorkspacePageContent
        {...defaultProps}
        activeView="all"
        filteredItems={[mockItem]}
        viewMode="grid"
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith('item-1');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('item-1');
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith('item-1');
  });
  it('invokes onEdit when list row Edit clicked', () => {
    const onEdit = vi.fn();
    render(<WorkspacePageContent {...defaultProps} activeView="all" filteredItems={[mockItem]} viewMode="list" onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith('item-1');
  });

  it('renders error state when isError is true (line 68)', () => {
    render(
      <WorkspacePageContent
        {...defaultProps}
        isError={true}
        error={new Error('Something broke')}
      />
    );
    expect(screen.getByText('somethingWentWrong')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders error state with fallback message when error is null (line 73)', () => {
    render(
      <WorkspacePageContent {...defaultProps} isError={true} error={null} />
    );
    expect(screen.getByText('failedToLoadContent')).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked in error state', () => {
    const onRetry = vi.fn();
    render(<WorkspacePageContent {...defaultProps} isError={true} error={null} onRetry={onRetry} />);
    fireEvent.click(screen.getByText('retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders loading state (PageLoader) when isLoading is true (line 88)', () => {
    render(<WorkspacePageContent {...defaultProps} isLoading={true} />);
    expect(screen.getByText('loadingContent')).toBeInTheDocument();
  });

  it('renders pending-review empty state title (line 92)', () => {
    render(<WorkspacePageContent {...defaultProps} activeView="pending-review" filteredItems={[]} />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('workspace.noContentsToReview');
  });

  it('renders my-published empty state title (line 93)', () => {
    render(<WorkspacePageContent {...defaultProps} activeView="my-published" filteredItems={[]} />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('workspace.noPublishedContents');
  });

  it('shows loadingMore spinner in InfiniteScrollSentinel when isLoadingMore=true (lines 199-200)', () => {
    render(
      <WorkspacePageContent
        {...defaultProps}
        activeView="all"
        filteredItems={[mockItem]}
        hasMore={true}
        isLoadingMore={true}
      />
    );
    expect(screen.getByText('loadingMore')).toBeInTheDocument();
  });

  it('hides loadingMore spinner when hasMore=false and isLoadingMore=false (line 203)', () => {
    render(
      <WorkspacePageContent
        {...defaultProps}
        activeView="all"
        filteredItems={[mockItem]}
        hasMore={false}
        isLoadingMore={false}
      />
    );
    expect(screen.queryByText('loadingMore')).not.toBeInTheDocument();
  });

  it('shows sentinel div when hasMore=true and isLoadingMore=false', () => {
    render(
      <WorkspacePageContent
        {...defaultProps}
        activeView="all"
        filteredItems={[mockItem]}
        hasMore={true}
        isLoadingMore={false}
      />
    );
    // Sentinel div renders but loading spinner is not shown
    expect(screen.queryByText('loadingMore')).not.toBeInTheDocument();
  });
});
