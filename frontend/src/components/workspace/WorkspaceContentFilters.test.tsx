import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspaceContentFilters from './WorkspaceContentFilters';
import type { ContentTypeFilter, ViewMode } from '@/types/workspaceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'workspace.typeFilters.all': 'All Types',
        'workspace.typeFilters.course': 'Course',
        'workspace.typeFilters.content': 'Content',
        'workspace.typeFilters.quiz': 'Quiz',
        'workspace.typeFilters.collection': 'Collection',
        'workspace.aiEnhancedFilter': 'AI-enhanced content',
        'workspace.gridView': 'Grid view',
        'workspace.listView': 'List view',
      };
      return map[key] || key;
    },
  }),
}));

vi.mock('@/components/common/Button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button type="button" {...props}>{children}</button>
  ),
}));

vi.mock('@/components/common/DropdownMenu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: React.ComponentProps<'button'>) => (
    <button type="button" onClick={onClick} {...props}>{children}</button>
  ),
}));

const renderFilters = (overrides: Partial<React.ComponentProps<typeof WorkspaceContentFilters>> = {}) => {
  const onTypeFilterChange = vi.fn();
  const onEnrichmentFilterChange = vi.fn();
  const onViewModeChange = vi.fn();
  render(
    <WorkspaceContentFilters
      typeFilter={'all' as ContentTypeFilter}
      onTypeFilterChange={onTypeFilterChange}
      enrichmentFilter={[]}
      onEnrichmentFilterChange={onEnrichmentFilterChange}
      viewMode={'grid' as ViewMode}
      onViewModeChange={onViewModeChange}
      {...overrides}
    />,
  );
  return { onTypeFilterChange, onEnrichmentFilterChange, onViewModeChange };
};

describe('WorkspaceContentFilters', () => {
  it('hides the type filter for book-only creators/reviewers (negative)', () => {
    renderFilters({ isBookCreatorOnly: true });
    expect(screen.queryByText('All Types')).not.toBeInTheDocument();
  });

  it('calls onTypeFilterChange when a type is picked', () => {
    const { onTypeFilterChange } = renderFilters();
    fireEvent.click(screen.getByRole('button', { name: 'Quiz' }));
    expect(onTypeFilterChange).toHaveBeenCalledWith('quiz');
  });

  it('renders a single unpressed AI-enhanced toggle with an accessible name and tooltip', () => {
    renderFilters();
    const toggles = document.querySelectorAll('button[aria-pressed]');
    expect(toggles).toHaveLength(1);
    expect(toggles[0]).toHaveAttribute('aria-pressed', 'false');
    expect(toggles[0]).toHaveAttribute('aria-label', 'AI-enhanced content');
    expect(toggles[0]).toHaveAttribute('title', 'AI-enhanced content');
  });

  it('has no visible text, only the icon (negative)', () => {
    renderFilters();
    expect(screen.getByRole('button', { name: 'AI-enhanced content' }).textContent).toBe('');
  });

  it('calls onEnrichmentFilterChange(true) when the inactive toggle is clicked', () => {
    const { onEnrichmentFilterChange } = renderFilters();
    fireEvent.click(screen.getByRole('button', { name: 'AI-enhanced content' }));
    expect(onEnrichmentFilterChange).toHaveBeenCalledWith(true);
  });

  it('marks the toggle as pressed when any type is selected and calls onEnrichmentFilterChange(false) when clicked', () => {
    const { onEnrichmentFilterChange } = renderFilters({ enrichmentFilter: ['Transcript'] });
    const button = screen.getByRole('button', { name: 'AI-enhanced content' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(onEnrichmentFilterChange).toHaveBeenCalledWith(false);
  });

  it('calls onViewModeChange for grid/list toggles', () => {
    const { onViewModeChange } = renderFilters();
    fireEvent.click(screen.getByLabelText('List view'));
    expect(onViewModeChange).toHaveBeenCalledWith('list');
  });
});
