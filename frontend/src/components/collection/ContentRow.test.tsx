import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContentRow, { type ContentRowProps } from './ContentRow';
import type { HierarchyContentNode } from '@/types/collectionTypes';

const mockToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('SelfAssess attempt limits', () => {
    const selfAssessNode: HierarchyContentNode = {
      identifier: 'quiz-1',
      name: 'Quiz',
      mimeType: 'application/vnd.ekstep.quiz',
      contentType: 'SelfAssess',
      maxAttempts: 2,
    };

    it('renders as disabled row and shows max-attempt toast on click when attempts exceeded', () => {
      renderContentRow({
        ...defaultProps,
        node: selfAssessNode,
        href: '/collection/col-1/content/quiz-1',
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 2 } },
      });
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      const row = screen.getByRole('button', { name: /Quiz/i });
      expect(row).toBeInTheDocument();
      fireEvent.click(row);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'courseDetails.selfAssessMaxAttempt',
        variant: 'destructive',
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('renders as button and shows last-attempt toast and navigates on click when last attempt', () => {
      renderContentRow({
        ...defaultProps,
        node: selfAssessNode,
        href: '/collection/col-1/content/quiz-1',
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 1 } },
      });
      const btn = screen.getByRole('button', { name: /Quiz/i });
      fireEvent.click(btn);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'courseDetails.selfAssessLastAttempt',
        variant: 'default',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-1/content/quiz-1');
    });

    it('renders as link when SelfAssess but attempts not exceeded and not last attempt', () => {
      renderContentRow({
        ...defaultProps,
        node: { ...selfAssessNode, maxAttempts: 3 },
        href: '/collection/col-1/content/quiz-1',
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 0 } },
      });
      const link = screen.getByRole('link', { name: /Quiz/i });
      expect(link).toHaveAttribute('href', '/collection/col-1/content/quiz-1');
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('renders as link when node is SelfAssess but maxAttempts is not set', () => {
      renderContentRow({
        ...defaultProps,
        node: { ...selfAssessNode, maxAttempts: undefined },
        href: '/collection/col-1/content/quiz-1',
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 5 } },
      });
      expect(screen.getByRole('link', { name: /Quiz/i })).toBeInTheDocument();
    });

    it('renders as link when contentAttemptInfoMap is empty for SelfAssess', () => {
      renderContentRow({
        ...defaultProps,
        node: selfAssessNode,
        href: '/collection/col-1/content/quiz-1',
        contentAttemptInfoMap: {},
      });
      expect(screen.getByRole('link', { name: /Quiz/i })).toBeInTheDocument();
    });

    it('shows current/max attempt count (e.g. 3/4) after title for SelfAssess when maxAttempts and contentAttemptInfoMap are set', () => {
      renderContentRow({
        ...defaultProps,
        node: { ...selfAssessNode, maxAttempts: 4 },
        href: '/collection/col-1/content/quiz-1',
        contentAttemptInfoMap: { 'quiz-1': { attemptCount: 3 } },
      });
      expect(screen.getByText('3/4')).toBeInTheDocument();
      expect(screen.getByText('Quiz')).toBeInTheDocument();
    });
  });
});
