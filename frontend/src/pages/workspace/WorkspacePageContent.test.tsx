import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspacePageContent from './WorkspacePageContent';
import type { WorkspaceItem } from '@/types/workspaceTypes';

const mockT = (key: string) => key;
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
  contentType: 'Course',
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
  it('calls onCreateOption when option selected in create view and when uploads action clicked', () => {
    const onCreateOption = vi.fn();
    render(<WorkspacePageContent {...defaultProps} activeView="create" onCreateOption={onCreateOption} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select option' }));
    expect(onCreateOption).toHaveBeenCalledWith('course');
    onCreateOption.mockClear();
    render(<WorkspacePageContent {...defaultProps} activeView="uploads" onCreateOption={onCreateOption} />);
    fireEvent.click(screen.getByRole('button', { name: 'uploadContent' }));
    expect(onCreateOption).toHaveBeenCalledWith('upload-content');
  });
  it('renders uploads EmptyState when activeView is uploads', () => {
    render(<WorkspacePageContent {...defaultProps} activeView="uploads" />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('noUploadsYet');
    expect(screen.getByTestId('empty-desc')).toHaveTextContent('uploadHere');
  });
  it('renders collaborations EmptyState when activeView is collaborations', () => {
    render(<WorkspacePageContent {...defaultProps} activeView="collaborations" />);
    expect(screen.getByTestId('empty-title')).toHaveTextContent('noCollaborations');
    expect(screen.getByTestId('empty-desc')).toHaveTextContent('sharedWithYou');
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
});
