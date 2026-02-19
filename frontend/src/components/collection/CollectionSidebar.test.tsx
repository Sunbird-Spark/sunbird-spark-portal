import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CollectionSidebar from './CollectionSidebar';
import type { Module } from '@/types/collectionTypes';

const mockModules: Module[] = [
  {
    id: 'mod-1',
    title: 'Module One',
    subtitle: 'First module subtitle',
    lessons: [
      { id: 'lesson-1', title: 'Video Lesson', type: 'video', mimeType: 'video/mp4' },
      { id: 'lesson-2', title: 'Document Lesson', type: 'document', mimeType: 'application/pdf' },
      {
        id: 'lesson-col',
        title: 'Nested Course',
        type: 'document',
        mimeType: 'application/vnd.ekstep.content-collection',
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Module Two',
    subtitle: 'Second module subtitle',
    lessons: [
      { id: 'lesson-3', title: 'Another Video', type: 'video' },
    ],
  },
];

describe('CollectionSidebar', () => {
  const defaultProps: React.ComponentProps<typeof CollectionSidebar> = {
    modules: mockModules,
    expandedModules: ['mod-1'],
    toggleModule: vi.fn(),
  };

  const renderSidebar = (props = defaultProps) => {
    return render(
      <BrowserRouter>
        <CollectionSidebar {...props} />
      </BrowserRouter>
    );
  };

  it('renders all module titles and subtitles', () => {
    renderSidebar();

    expect(screen.getByText('Module One')).toBeInTheDocument();
    expect(screen.getByText('First module subtitle')).toBeInTheDocument();
    expect(screen.getByText('Module Two')).toBeInTheDocument();
    expect(screen.getByText('Second module subtitle')).toBeInTheDocument();
  });

  it('calls toggleModule when module header is clicked', () => {
    const toggleModule = vi.fn();
    renderSidebar({ ...defaultProps, toggleModule });

    fireEvent.click(screen.getByText('Module One'));
    expect(toggleModule).toHaveBeenCalledWith('mod-1');

    toggleModule.mockClear();
    fireEvent.click(screen.getByText('Module Two'));
    expect(toggleModule).toHaveBeenCalledWith('mod-2');
  });

  it('renders lessons when module is expanded', () => {
    renderSidebar();

    expect(screen.getByText('Video Lesson')).toBeInTheDocument();
    expect(screen.getByText('Document Lesson')).toBeInTheDocument();
    expect(screen.queryByText('Another Video')).not.toBeInTheDocument();
  });

  it('renders lessons for expanded modules only', () => {
    renderSidebar({ ...defaultProps, expandedModules: ['mod-2'] });

    expect(screen.getByText('Another Video')).toBeInTheDocument();
    expect(screen.queryByText('Video Lesson')).not.toBeInTheDocument();
    expect(screen.queryByText('Document Lesson')).not.toBeInTheDocument();
  });

  it('renders video lesson link with correct href for content route', () => {
    renderSidebar();

    const videoLink = screen.getByRole('link', { name: /Video Lesson/ });
    expect(videoLink).toHaveAttribute('href', '/content/lesson-1');
  });

  it('renders document lesson link with correct href for content route', () => {
    renderSidebar();

    const documentLink = screen.getByRole('link', { name: /Document Lesson/ });
    expect(documentLink).toHaveAttribute('href', '/content/lesson-2');
  });

  it('renders collection lesson link with correct href for collection route', () => {
    renderSidebar();

    const collectionLink = screen.getByRole('link', { name: /Nested Course/ });
    expect(collectionLink).toHaveAttribute('href', '/collection/lesson-col');
  });

  it('updates active lesson when a lesson link is clicked', () => {
    renderSidebar();

    const documentLink = screen.getByRole('link', { name: /Document Lesson/ });
    fireEvent.click(documentLink);

    const activeLink = screen.getByRole('link', { name: /Document Lesson/ });
    expect(activeLink).toHaveClass('border-sunbird-brick');
  });

  it('renders expand/collapse chevron for each module', () => {
    renderSidebar();

    const moduleButtons = screen.getAllByRole('button');
    expect(moduleButtons.length).toBe(mockModules.length);
    moduleButtons.forEach((btn) => {
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('handles empty modules array', () => {
    renderSidebar({ ...defaultProps, modules: [] });

    expect(screen.queryByText('Module One')).not.toBeInTheDocument();
  });

  describe('when contentBlocked is true', () => {
    it('renders lessons as non-focusable divs without links', () => {
      renderSidebar({ ...defaultProps, contentBlocked: true });

      expect(screen.queryByRole('link', { name: /Video Lesson/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Document Lesson/ })).not.toBeInTheDocument();
      expect(screen.getByText('Video Lesson')).toBeInTheDocument();
      expect(screen.getByText('Document Lesson')).toBeInTheDocument();
    });

    it('renders lessons with aria-disabled', () => {
      renderSidebar({ ...defaultProps, contentBlocked: true });

      const videoLessonRow = screen.getByText('Video Lesson').closest('[aria-disabled="true"]');
      expect(videoLessonRow).toBeInTheDocument();
    });

    it('does not show any lesson as active (no brick border)', () => {
      renderSidebar({ ...defaultProps, contentBlocked: true });

      const videoLessonRow = screen.getByText('Video Lesson').closest('div');
      expect(videoLessonRow).not.toHaveClass('border-sunbird-brick');
    });
  });

  describe('when contentBlocked is false (default)', () => {
    it('renders lessons as links', () => {
      renderSidebar();

      expect(screen.getByRole('link', { name: /Video Lesson/ })).toHaveAttribute('href', '/content/lesson-1');
      expect(screen.getByRole('link', { name: /Document Lesson/ })).toHaveAttribute('href', '/content/lesson-2');
    });
  });
});
