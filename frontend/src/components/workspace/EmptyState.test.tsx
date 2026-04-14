import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState title="No items" description="Create your first item." />
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Create your first item.')).toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction are provided', () => {
    render(
      <EmptyState
        title="Empty"
        description="Desc"
        actionLabel="Create"
        onAction={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('does not render action button when onAction is missing', () => {
    render(
      <EmptyState title="Empty" description="Desc" actionLabel="Create" />
    );
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Empty"
        description="Desc"
        actionLabel="Upload"
        onAction={onAction}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
