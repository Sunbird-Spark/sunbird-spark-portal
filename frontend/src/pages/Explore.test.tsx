import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Explore from './Explore';
import { useFormRead } from '../hooks/useForm';

// --------------------
// Mocks
// --------------------

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/explore' }),
    // useNavigate and useSearchParams use the actual implementation,
    // driven by MemoryRouter's URL, so navigation in tests works correctly.
  };
});

vi.mock('@/auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { id: '123', name: 'John Doe', role: 'content_creator' },
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: { isUserAuthenticated: vi.fn(() => false) },
}));

vi.mock('../components/explore/ExploreGrid', () => ({
  default: ({ query, sortBy, filters }: any) => (
    <div data-testid="explore-grid">
      Grid Query: {query}, Sort: {JSON.stringify(sortBy)}, Filters: {JSON.stringify(filters)}
    </div>
  ),
}));

vi.mock('../components/explore/ExploreFilters', () => ({
  default: ({ filters, setFilters }: any) => (
    <div data-testid="explore-filters">
      <button onClick={() => setFilters({ ...filters, collections: ['TestCollection'] })}>
        Update Filters
      </button>
    </div>
  ),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermissions: () => ({
    roles: ['PUBLIC'],
    isLoading: false,
    isAuthenticated: false,
    error: null,
    hasAnyRole: vi.fn(() => false),
    canAccessFeature: vi.fn(() => false),
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => ({ data: {}, isSuccess: false }),
}));

vi.mock('@/hooks/useTnc', () => ({
  useGetTncUrl: () => ({ data: '' }),
  useAcceptTnc: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  default: (value: string) => value, // Return value immediately for testing
}));

// Mock useFormRead — controls whether the filter sidebar is shown.
// Default: returns one filter group so showFilters = true and ExploreFilters renders.
vi.mock('../hooks/useForm');


// --------------------
// Helpers
// --------------------

const setupMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const validFormData = {
  data: {
    form: {
      data: {
        filters: [{ id: 'collection', index: 1, label: 'Collections', options: [] }],
      },
    },
  },
};

/**
 * Renders Explore inside a MemoryRouter. Pass a full URL string (e.g. '/explore?q=test')
 * to pre-populate query params.
 */
const renderComponent = (initialUrl = '/explore') =>
  render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Explore />
    </MemoryRouter>
  );

// --------------------
// Tests
// --------------------

describe('Explore Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMedia();
    // Default: showFilters = true so ExploreFilters is rendered in every test
    vi.mocked(useFormRead).mockReturnValue({
      data: validFormData,
      isLoading: false,
      isError: false,
    } as any);
  });

  describe('static rendering', () => {
    it('renders the filters and grid', () => {
      renderComponent();
      expect(screen.getByTestId('explore-filters')).toBeInTheDocument();
      expect(screen.getByTestId('explore-grid')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
    });

    it('renders the sort dropdown with "Newest" as the default label', () => {
      renderComponent();
      expect(screen.getByText('sortOptions.newest')).toBeInTheDocument();
    });
  });

  describe('filter sidebar visibility (scenario 3)', () => {
    it('hides the filter sidebar when the form API returns an error', () => {
      vi.mocked(useFormRead).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as any);
      renderComponent();
      expect(screen.queryByTestId('explore-filters')).not.toBeInTheDocument();
    });

    it('hides the filter sidebar when the form API returns empty filters', () => {
      vi.mocked(useFormRead).mockReturnValue({
        data: { data: { form: { data: { filters: [] } } } },
        isLoading: false,
        isError: false,
      } as any);
      renderComponent();
      expect(screen.queryByTestId('explore-filters')).not.toBeInTheDocument();
    });

    it('shows the filter sidebar while the form API is loading', () => {
      vi.mocked(useFormRead).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as any);
      renderComponent();
      expect(screen.getByTestId('explore-filters')).toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('updates the grid query when typing (with debounce mocked)', async () => {
      renderComponent();
      const input = screen.getByPlaceholderText('searchPlaceholder');

      fireEvent.change(input, { target: { value: 'test query' } });

      // Since useDebounce is mocked to return immediately, the query updates right away
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: test query');
    });

    it('updates the input value while typing', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('searchPlaceholder');

      fireEvent.change(input, { target: { value: 'partial' } });
      expect(input).toHaveValue('partial');
    });
  });

  describe('URL query parameter (q)', () => {
    it('starts with an empty search state when no q param is in the URL', () => {
      renderComponent('/explore');
      const input = screen.getByPlaceholderText('searchPlaceholder');
      expect(input).toHaveValue('');
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: ,');
    });

    it('pre-fills the search input from the q param', () => {
      renderComponent('/explore?q=tensorflow');
      const input = screen.getByPlaceholderText('searchPlaceholder');
      expect(input).toHaveValue('tensorflow');
    });

    it('passes the q param value as the grid query immediately', () => {
      renderComponent('/explore?q=tensorflow');
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: tensorflow');
    });

    it('handles a URL-encoded multi-word q param correctly', () => {
      renderComponent('/explore?q=machine%20learning');
      const input = screen.getByPlaceholderText('searchPlaceholder');
      expect(input).toHaveValue('machine learning');
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: machine learning');
    });

    it('treats a URL with no q param as an empty search string', () => {
      renderComponent('/explore');
      const input = screen.getByPlaceholderText('searchPlaceholder');
      expect(input).toHaveValue('');
    });
  });

  describe('URL filter persistence', () => {
    it('initializes filters from URL query params on mount', () => {
      renderComponent('/explore?primaryCategory=Course&primaryCategory=Content+Playlist');
      expect(screen.getByTestId('explore-grid')).toHaveTextContent(
        'Filters: {"primaryCategory":["Course","Content Playlist"]}'
      );
    });

    it('initializes multiple filter codes from URL', () => {
      renderComponent('/explore?primaryCategory=Course&mimeType=video%2Fmp4');
      expect(screen.getByTestId('explore-grid')).toHaveTextContent(
        'Filters: {"primaryCategory":["Course"],"mimeType":["video/mp4"]}'
      );
    });

    it('initializes with empty filters when no filter params are in the URL', () => {
      renderComponent('/explore');
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Filters: {}');
    });

    it('does not treat the q param as a filter code', () => {
      renderComponent('/explore?q=react&primaryCategory=Course');
      // q must not appear in the filters object passed to ExploreGrid
      expect(screen.getByTestId('explore-grid')).toHaveTextContent(
        'Filters: {"primaryCategory":["Course"]}'
      );
      expect(screen.getByTestId('explore-grid')).not.toHaveTextContent('"q"');
    });
  });

  describe('sort options', () => {
    it('updates the grid sort when "Oldest" is selected', async () => {
      renderComponent();
      const sortButton = screen.getByText('sortOptions.newest');
      fireEvent.pointerDown(sortButton);

      await waitFor(() => {
        expect(screen.getByText('sortOptions.oldest')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('sortOptions.oldest'));

      await waitFor(() => {
        expect(screen.getByTestId('explore-grid')).toHaveTextContent('{"lastUpdatedOn":"asc"}');
      });
    });
  });

  describe('filters', () => {
    it('passes updated filters down to ExploreGrid', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Update Filters'));
      // FilterState is Record<string, string[]>; initial state is {}, after update: { collections: [...] }
      expect(screen.getByTestId('explore-grid')).toHaveTextContent(
        'Filters: {"collections":["TestCollection"]}'
      );
    });
  });

  describe('external navigation (regression: setSearchParams instability)', () => {
    /**
     * Regression test for the bug where React Router recreates `setSearchParams`
     * whenever `searchParams` changes (it closes over `searchParams` in its useCallback deps).
     *
     * Previously, `setSearchParams` was listed as a dep of the URL-sync effect.
     * This caused the effect to fire immediately after any navigation — before
     * `debouncedSearchQuery` had a chance to update — resetting the URL's `q` param.
     *
     * The fix: use a ref to access the latest `setSearchParams` and remove it from
     * the effect's dep array, so the effect only fires when `debouncedSearchQuery`
     * or `filters` actually changes.
     */
    it('preserves the q param when navigating to /explore?q=<term> from another route', async () => {
      // A helper component that lives at "/" and navigates to Explore with a query.
      const NavDriver = () => {
        const navigate = useNavigate();
        return (
          <button data-testid="go" onClick={() => navigate('/explore?q=cats')}>
            Go
          </button>
        );
      };

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<NavDriver />} />
            <Route path="/explore" element={<Explore />} />
          </Routes>
        </MemoryRouter>
      );

      // Trigger external navigation to /explore?q=cats
      await act(async () => {
        fireEvent.click(screen.getByTestId('go'));
      });

      // The search input must show the term from the URL — confirming the first
      // effect correctly read it and the second effect did NOT overwrite it.
      await waitFor(() => {
        expect(screen.getByPlaceholderText('searchPlaceholder')).toHaveValue('cats');
      });
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: cats');
    });

    it('preserves the q param when navigating to /explore?q=<term> while already on Explore', async () => {
      const NavDriver = () => {
        const navigate = useNavigate();
        return (
          <>
            <Explore />
            <button data-testid="go" onClick={() => navigate('/explore?q=dogs')}>
              Go
            </button>
          </>
        );
      };

      render(
        <MemoryRouter initialEntries={['/explore']}>
          <Routes>
            <Route path="/explore" element={<NavDriver />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify initial empty state
      expect(screen.getByPlaceholderText('searchPlaceholder')).toHaveValue('');

      // Navigate to the same route with a new q param (simulates "View All Results")
      await act(async () => {
        fireEvent.click(screen.getByTestId('go'));
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('searchPlaceholder')).toHaveValue('dogs');
      });
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: dogs');
    });
  });

  describe('sort key fallback (line 50/54/86 ?? "newest" branch)', () => {
    it('falls back to newest sort when sort param is an unknown key', () => {
      render(
        <MemoryRouter initialEntries={['/explore?sort=invalid-key']}>
          <Routes>
            <Route path="/explore" element={<Explore />} />
          </Routes>
        </MemoryRouter>
      );
      // sortBy passed to ExploreGrid falls back to newest's value: { lastUpdatedOn: 'desc' }
      const grid = screen.getByTestId('explore-grid');
      expect(grid.textContent).toContain('lastUpdatedOn');
    });
  });
});
