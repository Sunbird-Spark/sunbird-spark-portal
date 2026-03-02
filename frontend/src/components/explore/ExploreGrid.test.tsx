import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExploreGrid from './ExploreGrid';
import { useContentSearch } from '../../hooks/useContent';
import type { FilterState } from '../../pages/Explore';

// Mock dependencies
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../hooks/useContent', () => ({
  useContentSearch: vi.fn(),
}));

// Mock IntersectionObserver
let observerCallback: ((entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void) | null = null;
const observeSpy = vi.fn();
const unobserveSpy = vi.fn();
const disconnectSpy = vi.fn();

class MockIntersectionObserver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void, _options?: any) {
    observerCallback = callback;
  }
  observe = observeSpy;
  unobserve = unobserveSpy;
  disconnect = disconnectSpy;
  takeRecords() { return []; }
}
window.IntersectionObserver = MockIntersectionObserver as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockContent: any[] = [
  {
    identifier: 'course-1',
    name: 'Test Course 1',
    contentType: 'Course',
    appIcon: 'test-icon.png',
    leafNodesCount: 10,
    mimeType: 'application/vnd.ekstep.content-collection'
  },
  {
    identifier: 'resource-1',
    name: 'Test PDF',
    contentType: 'Resource',
    mimeType: 'application/pdf',
    appIcon: 'pdf-icon.png'
  },
  {
    identifier: 'resource-2',
    name: 'Test Epub',
    contentType: 'Resource',
    mimeType: 'application/epub+zip',
    appIcon: 'epub-icon.png'
  },
  {
    identifier: 'resource-3',
    name: 'Test Video',
    contentType: 'Resource',
    mimeType: 'video/mp4',
    appIcon: 'video-icon.png'
  }
];

describe('ExploreGrid', () => {
  // FilterState is now Record<string, string[]> — keys are API `code` values
  const defaultProps = {
    filters: {} as FilterState,
    query: '',
    sortBy: { lastUpdatedOn: 'desc' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  it('renders without crashing', async () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: { data: { content: [] } },
        isLoading: false,
        error: null,
    } as any);
    renderComponent();
    await waitFor(() => {
       expect(screen.queryByText('No content found')).toBeInTheDocument();
    });
  });

  it('fetches and displays content', async () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: { data: { content: mockContent } },
        isLoading: false,
        error: null,
    } as any);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      expect(screen.getByText('Test PDF')).toBeInTheDocument();
      expect(screen.getByText('Test Epub')).toBeInTheDocument();
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
    } as any);
    renderComponent();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
    } as any);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays empty state when no content found', async () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: { data: { content: [] } },
        isLoading: false,
        error: null,
    } as any);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No content found')).toBeInTheDocument();
    });
  });

  it('refetches when query changes', async () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: { data: { content: [] } },
        isLoading: false,
        error: null,
    } as any);

    const { rerender } = render(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} query="initial" />
      </BrowserRouter>
    );

    expect(useContentSearch).toHaveBeenCalledWith(expect.objectContaining({ 
        request: expect.objectContaining({ query: 'initial' }) 
    }));

    rerender(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} query="updated" />
      </BrowserRouter>
    );

    await waitFor(() => {
        expect(useContentSearch).toHaveBeenLastCalledWith(expect.objectContaining({ 
            request: expect.objectContaining({ query: 'updated' }) 
        }));
    });
  });

  it('refetches when filters change', async () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: { data: { content: [] } },
        isLoading: false,
        error: null,
    } as any);

    const { rerender } = render(
        <BrowserRouter>
            <ExploreGrid {...defaultProps} />
        </BrowserRouter>
    );

    // FilterState keys are API `code` values — passed directly into the search request
    const newFilters: FilterState = {
        primaryCategory: ['Collection1'],
        mimeType: ['video/mp4', 'video/webm'],
    };

    rerender(
        <BrowserRouter>
            <ExploreGrid {...defaultProps} filters={newFilters} />
        </BrowserRouter>
    );

    await waitFor(() => {
        expect(useContentSearch).toHaveBeenLastCalledWith(
            expect.objectContaining({
                request: expect.objectContaining({
                    filters: expect.objectContaining({
                        objectType: ['Content', 'QuestionSet'],
                        primaryCategory: ['Collection1'],
                        mimeType: ['video/mp4', 'video/webm'],
                    })
                })
            })
        );
    });
  });

  it('excludes filter codes with empty value arrays from the search request', async () => {
    vi.mocked(useContentSearch).mockReturnValue({
        data: { data: { content: [] } },
        isLoading: false,
        error: null,
    } as any);

    // Empty arrays should be stripped — only objectType should be in filters
    render(
        <BrowserRouter>
            <ExploreGrid {...defaultProps} filters={{ primaryCategory: [] }} />
        </BrowserRouter>
    );

    await waitFor(() => {
        expect(useContentSearch).toHaveBeenCalledWith(
            expect.objectContaining({
                request: expect.objectContaining({
                    filters: { objectType: ['Content', 'QuestionSet'] }
                })
            })
        );
    });
  });

  it('loads more content on infinite scroll', async () => {
    // Page 1
    vi.mocked(useContentSearch).mockReturnValue({
        data: {
            data: {
                content: Array(9).fill(null).map((_, i) => ({
                    identifier: `course-${i}-page-1`,
                    name: `Course ${i}`,
                    contentType: 'Course',
                    leafNodesCount: 10
                }))
            }
        },
        isLoading: false,
        error: null,
    } as any);
    
    observerCallback = null;

    renderComponent();

    await waitFor(() => {
        expect(useContentSearch).toHaveBeenCalledWith(expect.objectContaining({ 
            request: expect.objectContaining({ offset: 0 }) 
        }));
    });

    // Mock page 2 return
    vi.mocked(useContentSearch).mockReturnValue({
        data: {
            data: {
                content: Array(9).fill(null).map((_, i) => ({
                    identifier: `course-${i}-page-2`,
                    name: `Course ${i} Page 2`,
                    contentType: 'Course',
                    leafNodesCount: 10
                }))
            }
        },
        isLoading: false,
        error: null,
    } as any);

    const mockEntries = [{ isIntersecting: true }] as IntersectionObserverEntry[];
    if (observerCallback) {
        const callback = observerCallback as (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;
        callback(mockEntries, {} as IntersectionObserver);
    } else {
        throw new Error("Observer callback was not captured");
    }

    await waitFor(() => {
         expect(useContentSearch).toHaveBeenLastCalledWith(expect.objectContaining({ 
             request: expect.objectContaining({ offset: 9 }) 
         }));
    });
  });

  it('does not load more content if results are empty', async () => {
    // Mock empty initial results
    vi.mocked(useContentSearch).mockReturnValue({
        data: { data: { content: [] } },
        isLoading: false,
        error: null,
    } as any);
    
    observerCallback = null;
    renderComponent();

    await waitFor(() => {
        expect(useContentSearch).toHaveBeenCalledWith(expect.objectContaining({ 
            request: expect.objectContaining({ offset: 0 }) 
        }));
    });

    // Try to trigger observer
    const mockEntries = [{ isIntersecting: true }] as IntersectionObserverEntry[];
    if (observerCallback) {
        const callback = observerCallback as (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;
        callback(mockEntries, {} as IntersectionObserver);
    }

    // Offset should NOT have incremented
    expect(useContentSearch).not.toHaveBeenLastCalledWith(expect.objectContaining({ 
        request: expect.objectContaining({ offset: 9 }) 
    }));
  });
});
