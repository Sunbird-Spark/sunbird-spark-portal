import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CollectionSidebar from './CollectionSidebar';
import type { HierarchyContentNode } from '@/types/collectionTypes';

const COLLECTION_MIME = 'application/vnd.ekstep.content-collection';

const mockChildren: HierarchyContentNode[] = [
  {
    identifier: 'mod-1',
    name: 'Module One',
    primaryCategory: 'First module subtitle',
    mimeType: COLLECTION_MIME,
    children: [
      { identifier: 'lesson-1', name: 'Video Lesson', mimeType: 'video/mp4' },
      { identifier: 'lesson-2', name: 'Document Lesson', mimeType: 'application/pdf' },
      {
        identifier: 'lesson-col',
        name: 'Nested Course',
        mimeType: COLLECTION_MIME,
      },
    ],
  },
  {
    identifier: 'mod-2',
    name: 'Module Two',
    primaryCategory: 'Second module subtitle',
    mimeType: COLLECTION_MIME,
    children: [
      { identifier: 'lesson-3', name: 'Another Video', mimeType: 'video/mp4' },
    ],
  },
];

describe('CollectionSidebar', () => {
  const defaultProps: React.ComponentProps<typeof CollectionSidebar> = {
    collectionId: 'col-123',
    children: mockChildren,
    expandedMainUnitIds: ['mod-1'],
    toggleMainUnit: vi.fn(),
  };

  const renderSidebar = (props = defaultProps) => {
    return render(
      <BrowserRouter>
        <CollectionSidebar {...props} />
      </BrowserRouter>
    );
  };

  it('renders all main unit titles and subtitles', () => {
    renderSidebar();

    expect(screen.getByText('Module One')).toBeInTheDocument();
    expect(screen.getByText('First module subtitle')).toBeInTheDocument();
    expect(screen.getByText('Module Two')).toBeInTheDocument();
    expect(screen.getByText('Second module subtitle')).toBeInTheDocument();
  });

  it('calls toggleMainUnit when main unit header is clicked', () => {
    const toggleMainUnit = vi.fn();
    renderSidebar({ ...defaultProps, toggleMainUnit });

    fireEvent.click(screen.getByText('Module One'));
    expect(toggleMainUnit).toHaveBeenCalledWith('mod-1');

    toggleMainUnit.mockClear();
    fireEvent.click(screen.getByText('Module Two'));
    expect(toggleMainUnit).toHaveBeenCalledWith('mod-2');
  });

  it('renders content when main unit is expanded', () => {
    renderSidebar();

    expect(screen.getByText('Video Lesson')).toBeInTheDocument();
    expect(screen.getByText('Document Lesson')).toBeInTheDocument();
    expect(screen.queryByText('Another Video')).not.toBeInTheDocument();
  });

  it('renders content for expanded main units only', () => {
    renderSidebar({ ...defaultProps, expandedMainUnitIds: ['mod-2'] });

    expect(screen.getByText('Another Video')).toBeInTheDocument();
    expect(screen.queryByText('Video Lesson')).not.toBeInTheDocument();
    expect(screen.queryByText('Document Lesson')).not.toBeInTheDocument();
  });

  it('renders video content link with correct collection-relative href', () => {
    renderSidebar();

    const videoLink = screen.getByRole('link', { name: /Video Lesson/ });
    expect(videoLink).toHaveAttribute('href', '/collection/col-123/content/lesson-1');
  });

  it('renders document content link with correct collection-relative href', () => {
    renderSidebar();

    const documentLink = screen.getByRole('link', { name: /Document Lesson/ });
    expect(documentLink).toHaveAttribute('href', '/collection/col-123/content/lesson-2');
  });

  it('renders nested collection (sub-unit) as section label when expanded', () => {
    renderSidebar();

    expect(screen.getByText('Nested Course')).toBeInTheDocument();
    const nestedCourseEl = screen.getByText('Nested Course');
    expect(nestedCourseEl.closest('a')).toBeNull();
  });

  it('highlights the active content when activeContentId prop matches', () => {
    renderSidebar({ ...defaultProps, activeContentId: 'lesson-2' });

    const activeLink = screen.getByRole('link', { name: /Document Lesson/ });
    expect(activeLink).toHaveClass('border-sunbird-brick');
  });

  it('highlights the first content when activeContentId matches lesson-1', () => {
    renderSidebar({ ...defaultProps, activeContentId: 'lesson-1' });

    const activeLink = screen.getByRole('link', { name: /Video Lesson/ });
    expect(activeLink).toHaveClass('border-sunbird-brick');
  });

  it('does not highlight any content when activeContentId is null', () => {
    renderSidebar({ ...defaultProps, activeContentId: null });

    const videoLink = screen.getByRole('link', { name: /Video Lesson/ });
    const documentLink = screen.getByRole('link', { name: /Document Lesson/ });
    expect(videoLink).not.toHaveClass('border-sunbird-brick');
    expect(documentLink).not.toHaveClass('border-sunbird-brick');
  });

  it('renders expand/collapse chevron for each main unit', () => {
    renderSidebar();

    const unitButtons = screen.getAllByRole('button');
    expect(unitButtons.length).toBe(mockChildren.length);
    unitButtons.forEach((btn) => {
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('handles empty children array', () => {
    renderSidebar({ ...defaultProps, children: [] });

    expect(screen.queryByText('Module One')).not.toBeInTheDocument();
  });

  describe('when contentBlocked is true', () => {
    it('renders content as non-focusable divs without links', () => {
      renderSidebar({ ...defaultProps, contentBlocked: true });

      expect(screen.queryByRole('link', { name: /Video Lesson/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Document Lesson/ })).not.toBeInTheDocument();
      expect(screen.getByText('Video Lesson')).toBeInTheDocument();
      expect(screen.getByText('Document Lesson')).toBeInTheDocument();
    });

    it('renders content with aria-disabled', () => {
      renderSidebar({ ...defaultProps, contentBlocked: true });

      const videoRow = screen.getByText('Video Lesson').closest('[aria-disabled="true"]');
      expect(videoRow).toBeInTheDocument();
    });

    it('does not show any content as active even when activeContentId matches', () => {
      renderSidebar({ ...defaultProps, contentBlocked: true, activeContentId: 'lesson-1' });

      const videoRow = screen.getByText('Video Lesson').closest('div');
      expect(videoRow).not.toHaveClass('border-sunbird-brick');
    });
  });

  describe('when contentBlocked is false (default)', () => {
    it('renders content as collection-relative links', () => {
      renderSidebar();

      expect(screen.getByRole('link', { name: /Video Lesson/ })).toHaveAttribute(
        'href',
        '/collection/col-123/content/lesson-1'
      );
      expect(screen.getByRole('link', { name: /Document Lesson/ })).toHaveAttribute(
        'href',
        '/collection/col-123/content/lesson-2'
      );
    });
  });
});
