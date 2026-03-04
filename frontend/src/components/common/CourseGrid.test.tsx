import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CourseGrid } from './CourseGrid';
import type { ContentSearchItem } from '@/types/workspaceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/content/CollectionCard', () => ({
  default: ({ item }: { item: ContentSearchItem }) => (
    <a href={`/collection/${item.identifier}`} data-testid="collection-card">
      {item.name}
    </a>
  ),
}));

vi.mock('@/components/content/ResourceCard', () => ({
  default: ({ item }: { item: ContentSearchItem }) => (
    <a href={`/content/${item.identifier}`} data-testid="resource-card">
      {item.name}
    </a>
  ),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

const COLLECTION_MIME = 'application/vnd.ekstep.content-collection';

describe('CourseGrid', () => {
  it('renders CollectionCard for collection mimeType', () => {
    const courses: ContentSearchItem[] = [
      { identifier: 'c1', name: 'Course 1', mimeType: COLLECTION_MIME },
    ];
    renderWithRouter(<CourseGrid title="Test" courses={courses} />);
    expect(screen.getByTestId('collection-card')).toBeInTheDocument();
    expect(screen.queryByTestId('resource-card')).not.toBeInTheDocument();
  });

  it('renders ResourceCard for non-collection mimeType', () => {
    const courses: ContentSearchItem[] = [
      { identifier: 'r1', name: 'Video 1', mimeType: 'video/mp4' },
    ];
    renderWithRouter(<CourseGrid title="Test" courses={courses} />);
    expect(screen.getByTestId('resource-card')).toBeInTheDocument();
    expect(screen.queryByTestId('collection-card')).not.toBeInTheDocument();
  });

  it('renders ResourceCard for pdf mimeType', () => {
    const courses: ContentSearchItem[] = [
      { identifier: 'r2', name: 'PDF Doc', mimeType: 'application/pdf' },
    ];
    renderWithRouter(<CourseGrid title="Test" courses={courses} />);
    expect(screen.getByTestId('resource-card')).toBeInTheDocument();
  });

  it('renders mixed cards based on mimeType', () => {
    const courses: ContentSearchItem[] = [
      { identifier: 'c1', name: 'Course 1', mimeType: COLLECTION_MIME },
      { identifier: 'r1', name: 'Video 1', mimeType: 'video/mp4' },
      { identifier: 'r2', name: 'PDF Doc', mimeType: 'application/pdf' },
    ];
    renderWithRouter(<CourseGrid title="Mixed" courses={courses} />);
    expect(screen.getAllByTestId('collection-card')).toHaveLength(1);
    expect(screen.getAllByTestId('resource-card')).toHaveLength(2);
  });

  it('renders the section title', () => {
    renderWithRouter(<CourseGrid title="My Section" courses={[]} />);
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('renders empty grid with no courses', () => {
    renderWithRouter(<CourseGrid title="Empty" courses={[]} />);
    expect(screen.queryByTestId('collection-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('resource-card')).not.toBeInTheDocument();
  });
});
