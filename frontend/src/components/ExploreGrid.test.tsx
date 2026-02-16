import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExploreGrid from './ExploreGrid';
import * as ContentService from '../services/ContentService';

// Mock dependencies
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../services/ContentService', () => ({
  searchContent: vi.fn().mockImplementation(() => Promise.resolve({ content: [] })),
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
  });

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  it('renders without crashing', async () => {
    (ContentService.searchContent as Mock).mockResolvedValue({ content: [] });
    renderComponent();
    // Should show loading spinner initially or empty state after load
    await waitFor(() => {
       expect(screen.queryByText('No content found')).toBeInTheDocument();
    });
  });

  it('fetches and displays content', async () => {
    (ContentService.searchContent as Mock).mockResolvedValue({ content: mockContent });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      expect(screen.getByText('Test PDF')).toBeInTheDocument();
      expect(screen.getByText('Test Epub')).toBeInTheDocument();
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    // Return a promise that never resolves explicitly to test loading state
    (ContentService.searchContent as Mock).mockReturnValue(new Promise(() => {}));
    renderComponent();
    // Verify searchContent was called to trigger loading state
    expect(ContentService.searchContent).toHaveBeenCalled();
  });

  it('handles error state', async () => {
    (ContentService.searchContent as Mock).mockRejectedValue(new Error('Network error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load courses')).toBeInTheDocument();
    });
  });

  it('displays empty state when no content found', async () => {
    (ContentService.searchContent as Mock).mockResolvedValue({ content: [] });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No content found')).toBeInTheDocument();
    });
  });

  it('refetches when query changes', async () => {
    (ContentService.searchContent as Mock).mockResolvedValue({ content: [] });
    const { rerender } = render(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} query="initial" />
      </BrowserRouter>
    );

    expect(ContentService.searchContent).toHaveBeenCalledWith(9, 0, 'initial', expect.anything(), expect.anything());

    // Update prop
    rerender(
      <BrowserRouter>
        <ExploreGrid {...defaultProps} query="updated" />
      </BrowserRouter>
    );

    await waitFor(() => {
        expect(ContentService.searchContent).toHaveBeenCalledWith(
            9, 
            0, 
            'updated', 
            expect.anything(), 
            expect.anything()
        );
    });
  });

  it('refetches when filters change', async () => {
    (ContentService.searchContent as Mock).mockResolvedValue({ content: [] });
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
        expect(ContentService.searchContent).toHaveBeenCalledTimes(2);
        // Check the second call arguments for filter
        expect(ContentService.searchContent).toHaveBeenLastCalledWith(
            9, 
            0, 
            '', 
            expect.anything(), 
            expect.objectContaining({ 
                primaryCategory: ['Collection1'],
                contentType: ['Course'],
                se_subjects: ['Math']
            })
        );
    });
  });

  it('loads more content on infinite scroll', async () => {
    (ContentService.searchContent as Mock).mockResolvedValue({ 
        content: Array(9).fill(null).map((_, i) => ({
            identifier: `course-${i}-page-1`,
            name: `Course ${i}`,
            contentType: 'Course',
            leafNodesCount: 10
        }))
    });
    
    // Clear previous callback to ensure we capture the new one
    observerCallback = null;

    renderComponent();

    // Initial load
    await waitFor(() => {
        expect(ContentService.searchContent).toHaveBeenCalledWith(9, 0, expect.anything(), expect.anything(), expect.anything());
    });

    // Mock second page response before triggering intersection
    (ContentService.searchContent as Mock).mockResolvedValue({ 
        content: Array(9).fill(null).map((_, i) => ({
            identifier: `course-${i}-page-2`,
            name: `Course ${i} Page 2`,
            contentType: 'Course',
            leafNodesCount: 10
        }))
    });

    // Simulate intersection
    const mockEntries = [{ isIntersecting: true }] as IntersectionObserverEntry[];
    // We need to ensure observerCallback is defined before calling it
    if (observerCallback) {
        // Wrap in act if necessary, but vitest usually handles it
        const callback = observerCallback as (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;
        callback(mockEntries, {} as IntersectionObserver);
    } else {
        throw new Error("Observer callback was not captured");
    }

    // Expect second call with offset
    await waitFor(() => {
         expect(ContentService.searchContent).toHaveBeenCalledTimes(2);
         expect(ContentService.searchContent).toHaveBeenLastCalledWith(9, 9, expect.anything(), expect.anything(), expect.anything());
    });
  });
});
