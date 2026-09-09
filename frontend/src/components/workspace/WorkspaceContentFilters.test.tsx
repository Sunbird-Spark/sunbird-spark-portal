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
        'workspace.typeFilters.learningPath': 'Learning Path',
        'workspace.hasTranscripts': 'Transcripts',
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
  const onTranscriptFilterChange = vi.fn();
  const onViewModeChange = vi.fn();
  render(
    <WorkspaceContentFilters
      typeFilter={'all' as ContentTypeFilter}
      onTypeFilterChange={onTypeFilterChange}
      transcriptFilter={false}
      onTranscriptFilterChange={onTranscriptFilterChange}
      viewMode={'grid' as ViewMode}
      onViewModeChange={onViewModeChange}
      {...overrides}
    />,
  );
  return { onTypeFilterChange, onTranscriptFilterChange, onViewModeChange };
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

  it('includes Learning Path as a selectable type', () => {
    const { onTypeFilterChange } = renderFilters();
    fireEvent.click(screen.getByRole('button', { name: 'Learning Path' }));
    expect(onTypeFilterChange).toHaveBeenCalledWith('learningPath');
  });

  it('toggles the transcript filter on click', () => {
    const { onTranscriptFilterChange } = renderFilters();
    fireEvent.click(screen.getByRole('button', { name: 'Transcripts' }));
    expect(onTranscriptFilterChange).toHaveBeenCalledWith(true);
  });

  it('calls onViewModeChange for grid/list toggles', () => {
    const { onViewModeChange } = renderFilters();
    fireEvent.click(screen.getByLabelText('List view'));
    expect(onViewModeChange).toHaveBeenCalledWith('list');
  });
});
