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
  author: 'Author',
};

describe('WorkspaceContentCard', () => {
  it('renders item title and description', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onView = vi.fn();
    const onSubmitReview = vi.fn();
    render(
      <WorkspaceContentCard
        item={defaultItem}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        onSubmitReview={onSubmitReview}
      />
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('calls onView when Preview is clicked', () => {
    const onView = vi.fn();
    render(
      <WorkspaceContentCard
        item={defaultItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={onView}
        onSubmitReview={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
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
        onSubmitReview={vi.fn()}
      />
    );
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    fireEvent.click(editButtons[0]!);
    expect(onEdit).toHaveBeenCalledWith('item-1');
  });

  it('calls onView when View menu item is clicked', () => {
    const onView = vi.fn();
    render(
      <WorkspaceContentCard
        item={defaultItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={onView}
        onSubmitReview={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
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
        onSubmitReview={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('item-1');
  });

  it('calls onSubmitReview when Submit for Review is clicked for draft', () => {
    const onSubmitReview = vi.fn();
    render(
      <WorkspaceContentCard
        item={defaultItem}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
        onSubmitReview={onSubmitReview}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit for Review' }));
    expect(onSubmitReview).toHaveBeenCalledWith('item-1');
  });
});
