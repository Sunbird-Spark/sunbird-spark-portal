import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspaceSidebar from './WorkspaceSidebar';
import type { WorkspaceView, UserRole } from '@/types/workspaceTypes';

const mockT = (key: string) => key;

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: mockT }),
}));

vi.mock('@/components/common/Badge', () => ({
  Badge: ({ children, ...props }: React.ComponentProps<'span'>) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

const baseCounts = { all: 5, drafts: 2, review: 1, published: 2, pendingReview: 3 };

function renderSidebar(overrides?: {
  activeView?: WorkspaceView;
  userRole?: UserRole;
  counts?: typeof baseCounts;
}) {
  const onViewChange = vi.fn();
  const onRoleChange = vi.fn();
  const props = {
    activeView: 'all' as WorkspaceView,
    userRole: 'creator' as UserRole,
    counts: baseCounts,
    onViewChange,
    onRoleChange,
    ...overrides,
  };
  render(<WorkspaceSidebar {...props} />);
  return { ...props, onViewChange, onRoleChange };
}

describe('WorkspaceSidebar', () => {
  it('calls onRoleChange when Creator or Reviewer is clicked', () => {
    const { onRoleChange } = renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Reviewer' }));
    expect(onRoleChange).toHaveBeenCalledWith('reviewer');
    fireEvent.click(screen.getByRole('button', { name: 'Creator' }));
    expect(onRoleChange).toHaveBeenCalledWith('creator');
  });

  it('shows creator menu items and calls onViewChange when a menu item is clicked', () => {
    const { onViewChange } = renderSidebar({ userRole: 'creator', activeView: 'all' });
    expect(screen.getByRole('button', { name: /createNew/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /allMyContent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /drafts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submittedForReview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /published/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /allUploads/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collaborations/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /drafts/i }));
    expect(onViewChange).toHaveBeenCalledWith('drafts');
    fireEvent.click(screen.getByRole('button', { name: /createNew/i }));
    expect(onViewChange).toHaveBeenCalledWith('create');
  });

  it('shows counts in creator menu for items that have counts', () => {
    renderSidebar({ userRole: 'creator', counts: { all: 10, drafts: 3, review: 2, published: 5, pendingReview: 0 } });
    const badges = screen.getAllByTestId('badge');
    const texts = badges.map((b) => b.textContent);
    expect(texts).toContain('10');
    expect(texts).toContain('3');
    expect(texts).toContain('2');
    expect(texts).toContain('5');
  });

  it('shows reviewer menu items and calls onViewChange', () => {
    const { onViewChange } = renderSidebar({ userRole: 'reviewer', activeView: 'pending-review' });
    expect(screen.getByRole('button', { name: /Pending Review/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Published by Me/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Published by Me/ }));
    expect(onViewChange).toHaveBeenCalledWith('my-published');
    fireEvent.click(screen.getByRole('button', { name: /Pending Review/ }));
    expect(onViewChange).toHaveBeenCalledWith('pending-review');
  });

  it('shows reviewer counts including pendingReview', () => {
    renderSidebar({
      userRole: 'reviewer',
      counts: { all: 0, drafts: 0, review: 0, published: 1, pendingReview: 4 },
    });
    const badges = screen.getAllByTestId('badge');
    const texts = badges.map((b) => b.textContent);
    expect(texts).toContain('4');
    expect(texts).toContain('1');
  });

  it('shows Quick Stats for creator with Published and In Review counts', () => {
    renderSidebar({ userRole: 'creator', counts: baseCounts });
    expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    const quickStatsSection = screen.getByText('Quick Stats').closest('div');
    expect(quickStatsSection).toHaveTextContent('2');
    expect(quickStatsSection).toHaveTextContent('1');
  });

  it('does not show Quick Stats for reviewer role', () => {
    renderSidebar({ userRole: 'reviewer' });
    expect(screen.queryByText('Quick Stats')).not.toBeInTheDocument();
  });
});
