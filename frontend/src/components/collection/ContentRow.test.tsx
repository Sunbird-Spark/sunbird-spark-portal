import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContentRow, { type ContentRowProps } from './ContentRow';
import type { HierarchyContentNode } from '@/types/collectionTypes';

const mockNode: HierarchyContentNode = {
  identifier: 'content-1',
  name: 'Test Lesson',
  mimeType: 'video/mp4',
};

const defaultProps: ContentRowProps = {
  node: mockNode,
  href: '/collection/col-1/content/content-1',
  contentBlocked: false,
  isActive: false,
  t: (key: string) => key,
};

function renderContentRow(props: ContentRowProps = defaultProps) {
  return render(
    <BrowserRouter>
      <ContentRow {...props} />
    </BrowserRouter>
  );
}

describe('ContentRow', () => {
  it('renders node title', () => {
    renderContentRow();
    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
  });

  it('renders as a link when contentBlocked is false', () => {
    renderContentRow();
    const link = screen.getByRole('link', { name: /Test Lesson/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/collection/col-1/content/content-1');
  });

  it('renders as div with aria-disabled when contentBlocked is true', () => {
    renderContentRow({ ...defaultProps, contentBlocked: true });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    const row = screen.getByText('Test Lesson').closest('[aria-disabled="true"]');
    expect(row).toBeInTheDocument();
  });

  it('applies active border class when isActive is true', () => {
    renderContentRow({ ...defaultProps, isActive: true });
    const link = screen.getByRole('link', { name: /Test Lesson/i });
    expect(link).toHaveClass('border-sunbird-brick');
  });

  it('shows status label when contentStatusMap is provided', () => {
    renderContentRow({
      ...defaultProps,
      contentStatusMap: { 'content-1': 2 },
    });
    expect(screen.getByText('courseDetails.contentStatusCompleted')).toBeInTheDocument();
  });

  it('uses "Untitled" when node has no name', () => {
    renderContentRow({ ...defaultProps, node: { ...mockNode, name: undefined } });
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });
});
