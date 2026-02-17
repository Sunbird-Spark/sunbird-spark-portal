import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DynamicContentSection from './DynamicContentSection';
import { useContentSearch } from '@/hooks/useContent';

vi.mock('@/hooks/useContent', () => ({
  useContentSearch: vi.fn(),
}));

vi.mock('@/components/common/CourseGrid', () => ({
  CourseGrid: ({ title, courses }: any) => (
    <div data-testid="course-grid">
      <h2>{title}</h2>
      <ul>{courses.map((c: any) => <li key={c.identifier}>{c.name}</li>)}</ul>
    </div>
  ),
}));

describe('DynamicContentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useContentSearch as any).mockReturnValue({ isLoading: true });
    const { container } = render(<DynamicContentSection title="Test Title" />);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('renders contents when data is loaded', () => {
    const mockData = {
      data: {
        content: [
          { identifier: '1', name: 'Course 1' },
          { identifier: '2', name: 'Course 2' },
        ]
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    render(<DynamicContentSection title="Popular Content" criteria={{ request: {} } as any} />);

    expect(screen.getByTestId('course-grid')).toBeInTheDocument();
    expect(screen.getByText('Popular Content')).toBeInTheDocument();
    expect(screen.getByText('Course 1')).toBeInTheDocument();
    expect(screen.getByText('Course 2')).toBeInTheDocument();
  });

  it('returns null on error', () => {
    (useContentSearch as any).mockReturnValue({ error: new Error('fail'), isLoading: false });
    const { container } = render(<DynamicContentSection title="Fail" />);
    expect(container.firstChild).toBeNull();
  });
});
