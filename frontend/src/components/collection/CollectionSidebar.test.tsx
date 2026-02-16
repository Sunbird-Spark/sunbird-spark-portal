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
      { id: 'lesson-1', title: 'Video Lesson', duration: '5:00', type: 'video' },
      { id: 'lesson-2', title: 'Document Lesson', duration: '—', type: 'document' },
    ],
  },
  {
    id: 'mod-2',
    title: 'Module Two',
    subtitle: 'Second module subtitle',
    lessons: [
      { id: 'lesson-3', title: 'Another Video', duration: '10:00', type: 'video' },
    ],
  },
];

describe('CollectionSidebar', () => {
  const defaultProps = {
    modules: mockModules,
    expandedModules: ['mod-1'],
    toggleModule: vi.fn(),
    collectionId: 'col-123',
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

  it('renders document lesson link with correct href for course lesson route', () => {
    renderSidebar();

    const documentLink = screen.getByRole('link', { name: /Document Lesson/ });
    expect(documentLink).toHaveAttribute('href', '/course/col-123/lesson/lesson-2');
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

  it('renders lesson duration', () => {
    renderSidebar();

    expect(screen.getByText('5:00')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
