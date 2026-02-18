import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspaceContentList from './WorkspaceContentList';
import type { WorkspaceItem } from '@/types/workspaceTypes';

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

const defaultItems: WorkspaceItem[] = [
  {
    id: 'item-1',
    title: 'First Item',
    description: 'Desc 1',
    type: 'content' as const,
    status: 'draft' as const,
    thumbnail: '',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    author: 'user-1',
    primaryCategory: 'Learning Resource',
    contentType: 'Content',
  },
];

describe('WorkspaceContentList', () => {
  it('renders list header and item titles', () => {
    render(
      <WorkspaceContentList
        items={defaultItems}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('First Item')).toBeInTheDocument();
  });

  it('calls onView when View action is clicked', () => {
    const onView = vi.fn();
    const publishedItems: WorkspaceItem[] = [{ ...defaultItems[0]!, status: 'published' }];
    render(
      <WorkspaceContentList
        items={publishedItems}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={onView}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith('item-1');
  });

  it('calls onEdit when Edit action is clicked', () => {
    const onEdit = vi.fn();
    render(
      <WorkspaceContentList
        items={defaultItems}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith('item-1');
  });

  it('calls onDelete when Delete menu item is clicked', () => {
    const onDelete = vi.fn();
    render(
      <WorkspaceContentList
        items={defaultItems}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onView={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('item-1');
  });
});
