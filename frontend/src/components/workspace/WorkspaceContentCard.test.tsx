import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspaceContentCard from './WorkspaceContentCard';

vi.mock('@/components/common/DropdownMenu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button type="button" onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
}));

const defaultItem = {
  id: 'item-1',
  title: 'Test Content',
  description: 'Description',
  type: 'content' as const,
  status: 'draft' as const,
  thumbnail: '',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  author: 'user-1',
  primaryCategory: 'Learning Resource',
  contentType: 'Content',
};

describe('WorkspaceContentCard', () => {
  it('renders item title and description', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onView = vi.fn();
    render(
      <WorkspaceContentCard
        item={defaultItem}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('calls onView when View action is clicked for published content', () => {
    const onView = vi.fn();
    const publishedItem = { ...defaultItem, status: 'published' as const };
    render(
      <WorkspaceContentCard
        item={publishedItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={onView}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]!);
    expect(onView).toHaveBeenCalledWith('item-1');
  });

  it('calls onEdit when Edit overlay button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <WorkspaceContentCard
        item={defaultItem}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    );
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    fireEvent.click(editButtons[0]!);
    expect(onEdit).toHaveBeenCalledWith('item-1');
  });

  it('calls onView when View menu item is clicked', () => {
    const onView = vi.fn();
    const publishedItem = { ...defaultItem, status: 'published' as const };
    render(
      <WorkspaceContentCard
        item={publishedItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={onView}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]!);
    expect(onView).toHaveBeenCalledWith('item-1');
  });

  it('calls onDelete when Delete menu item is clicked', () => {
    const onDelete = vi.fn();
    render(
      <WorkspaceContentCard
        item={defaultItem}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onView={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('item-1');
  });
});
