import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExploreGrid from './ExploreGrid';
import { ContentService } from '../services/ContentService';

// Mock dependencies
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

const mockContentSearch = vi.fn();
vi.mock('../services/ContentService', () => ({
  ContentService: vi.fn().mockImplementation(() => ({
    contentSearch: mockContentSearch
  }))
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
  const defaultProps = {
    filters: {
      collections: [],
      contentTypes: [],
      categories: []
    },
    query: '',
    sortBy: { lastUpdatedOn: 'desc' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockContentSearch.mockReset();
  });

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  it('renders without crashing', async () => {
    mockContentSearch.mockResolvedValue({ data: { content: [] } });
    renderComponent();
    await waitFor(() => {
       expect(screen.queryByText('No content found')).toBeInTheDocument();
    });
  });

  it('fetches and displays content', async () => {
    mockContentSearch.mockResolvedValue({ data: { content: mockContent } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      expect(screen.getByText('Test PDF')).toBeInTheDocument();
      expect(screen.getByText('Test Epub')).toBeInTheDocument();
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockContentSearch.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(mockContentSearch).toHaveBeenCalled();
  });

  it('handles error state', async () => {
    mockContentSearch.mockRejectedValue(new Error('Network error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    });
  });

  it('displays empty state when no content found', async () => {
    mockContentSearch.mockResolvedValue({ data: { content: [] } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No content found')).toBeInTheDocument();
    });
  });

  it('refetches when query changes', async () => {
    mockContentSearch.mockResolvedValue({ data: { content: [] } });
    const { rerender } = render(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} query="initial" />
      </BrowserRouter>
    );

    expect(mockContentSearch).toHaveBeenCalledWith(expect.objectContaining({ query: 'initial' }));

    rerender(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} query="updated" />
      </BrowserRouter>
    );

    await waitFor(() => {
        expect(mockContentSearch).toHaveBeenCalledWith(expect.objectContaining({ query: 'updated' }));
    });
  });

  it('refetches when filters change', async () => {
    mockContentSearch.mockResolvedValue({ data: { content: [] } });
    const { rerender } = render(
        <BrowserRouter>
            <ExploreGrid {...defaultProps} />
        </BrowserRouter>
    );
    
    const newFilters = {
        collections: ['Collection1'],
        contentTypes: ['Course'],
        categories: ['Math']
    };

    rerender(
        <BrowserRouter>
            <ExploreGrid {...defaultProps} filters={newFilters} />
        </BrowserRouter>
    );

    await waitFor(() => {
        expect(mockContentSearch).toHaveBeenCalledTimes(2);
        expect(mockContentSearch).toHaveBeenLastCalledWith(
            expect.objectContaining({
                filters: expect.objectContaining({ 
                    primaryCategory: ['Collection1'],
                    contentType: ['Course'],
                    se_subjects: ['Math'],
                    objectType: 'Content'
                })
            })
        );
    });
  });

  it('loads more content on infinite scroll', async () => {
    mockContentSearch.mockResolvedValue({ 
        data: {
            content: Array(9).fill(null).map((_, i) => ({
                identifier: `course-${i}-page-1`,
                name: `Course ${i}`,
                contentType: 'Course',
                leafNodesCount: 10
            }))
        }
    });
    
    observerCallback = null;

    renderComponent();

    await waitFor(() => {
        expect(mockContentSearch).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    mockContentSearch.mockResolvedValue({ 
        data: {
            content: Array(9).fill(null).map((_, i) => ({
                identifier: `course-${i}-page-2`,
                name: `Course ${i} Page 2`,
                contentType: 'Course',
                leafNodesCount: 10
            }))
        }
    });

    const mockEntries = [{ isIntersecting: true }] as IntersectionObserverEntry[];
    if (observerCallback) {
        const callback = observerCallback as (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;
        callback(mockEntries, {} as IntersectionObserver);
    } else {
        throw new Error("Observer callback was not captured");
    }

    await waitFor(() => {
         expect(mockContentSearch).toHaveBeenCalledTimes(2);
         expect(mockContentSearch).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 9 }));
    });
  });
});
