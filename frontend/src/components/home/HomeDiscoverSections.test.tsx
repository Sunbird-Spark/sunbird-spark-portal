import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeDiscoverSections from './HomeDiscoverSections';
import { useFormRead } from '@/hooks/useForm';

vi.mock('@/hooks/useForm', () => ({
  useFormRead: vi.fn(),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'loadingContent': 'Loading content...',
        'failedToLoadContent': 'Failed to load content',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message, error, onRetry }: { message: string; error?: string; onRetry?: () => void }) => (
    <div data-testid="page-loader">
      <span>{message}</span>
      {error && <span data-testid="error-message">{error}</span>}
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

vi.mock('@/components/landing/DynamicContentSection', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="dynamic-content-section">{title}</div>
  ),
}));

vi.mock('@/components/landing/DynamicCategorySection', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="dynamic-category-section">{title}</div>
  ),
}));

vi.mock('@/components/landing/DynamicResourceSection', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="dynamic-resource-section">{title}</div>
  ),
}));

const mockFormData = (sections: object[]) => ({
  data: {
    form: {
      data: {
        sections,
      },
    },
  },
});

describe('HomeDiscoverSections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while form data is fetching', () => {
    (useFormRead as any).mockReturnValue({ isLoading: true, error: null, data: undefined });

    render(<HomeDiscoverSections />);

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('shows error state with retry button when form data fetch fails', () => {
    const mockRefetch = vi.fn();
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: new Error('fetch failed'),
      data: undefined,
      refetch: mockRefetch,
    });

    render(<HomeDiscoverSections />);

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('fetch failed');
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('renders nothing when sections list is empty', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([]),
    });

    const { container } = render(<HomeDiscoverSections />);

    expect(container.firstChild).toBeNull();
  });

  it('renders DynamicContentSection for content-type section', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([
        { id: 's1', index: 1, type: 'content', title: 'Featured Courses' },
      ]),
    });

    render(<HomeDiscoverSections />);

    const section = screen.getByTestId('dynamic-content-section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent('Featured Courses');
  });

  it('renders DynamicCategorySection for categories-type section', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([
        { id: 's2', index: 1, type: 'categories', title: 'Browse Categories', list: [] },
      ]),
    });

    render(<HomeDiscoverSections />);

    const section = screen.getByTestId('dynamic-category-section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent('Browse Categories');
  });

  it('renders DynamicResourceSection for resources-type section', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([
        { id: 's3', index: 1, type: 'resources', title: 'Top Resources' },
      ]),
    });

    render(<HomeDiscoverSections />);

    const section = screen.getByTestId('dynamic-resource-section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveTextContent('Top Resources');
  });

  it('renders sections sorted by index regardless of input order', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([
        { id: 's3', index: 3, type: 'resources', title: 'Resources' },
        { id: 's1', index: 1, type: 'content', title: 'Content' },
        { id: 's2', index: 2, type: 'categories', title: 'Categories', list: [] },
      ]),
    });

    const { container } = render(<HomeDiscoverSections />);

    // Query all sections in actual DOM order
    const allSections = container.querySelectorAll('[data-testid^="dynamic-"]');

    // All three should be rendered
    expect(allSections).toHaveLength(3);

    // Verify DOM order matches sorted index order (content=1, categories=2, resources=3)
    expect(allSections[0]).toHaveAttribute('data-testid', 'dynamic-content-section');
    expect(allSections[0]).toHaveTextContent('Content');
    expect(allSections[1]).toHaveAttribute('data-testid', 'dynamic-category-section');
    expect(allSections[1]).toHaveTextContent('Categories');
    expect(allSections[2]).toHaveAttribute('data-testid', 'dynamic-resource-section');
    expect(allSections[2]).toHaveTextContent('Resources');
  });

  it('renders multiple sections of the same type', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([
        { id: 's1', index: 1, type: 'content', title: 'Popular Courses' },
        { id: 's2', index: 2, type: 'content', title: 'Recent Courses' },
      ]),
    });

    render(<HomeDiscoverSections />);

    const contentSections = screen.getAllByTestId('dynamic-content-section');
    expect(contentSections).toHaveLength(2);
    expect(contentSections[0]).toHaveTextContent('Popular Courses');
    expect(contentSections[1]).toHaveTextContent('Recent Courses');
  });

  it('skips unknown section types silently', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([
        { id: 's1', index: 1, type: 'content', title: 'Known Section' },
        { id: 's2', index: 2, type: 'unknown_type', title: 'Unknown Section' },
      ]),
    });

    render(<HomeDiscoverSections />);

    expect(screen.getByTestId('dynamic-content-section')).toBeInTheDocument();
    expect(screen.queryByText('Unknown Section')).not.toBeInTheDocument();
  });

  it('calls useFormRead with the correct home page parameters', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockFormData([]),
    });

    render(<HomeDiscoverSections />);

    expect(useFormRead).toHaveBeenCalledWith({
      request: {
        type: 'page',
        subType: 'home',
        action: 'sections',
        component: 'portal',
        framework: '*',
        rootOrgId: '*',
      },
    });
  });

  it('falls back to [] when formData sections is null/undefined (line 38 ?? [] branch)', () => {
    (useFormRead as any).mockReturnValue({
      isLoading: false,
      error: null,
      data: { data: { form: { data: {} } } }, // no sections key
    });

    const { container } = render(<HomeDiscoverSections />);
    // Should render empty (no sections), no crash
    expect(container.querySelector('[data-testid="dynamic-content-section"]')).toBeNull();
  });
});
