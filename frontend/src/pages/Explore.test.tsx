import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Explore from './Explore';

// --------------------
// Mocks
// --------------------

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/explore' }),
    useNavigate: () => vi.fn(),
    // useSearchParams uses the actual implementation, driven by MemoryRouter's URL
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

vi.mock('../components/home/HomeSidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
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

vi.mock('../components/home/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('../components/home/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('@/hooks/useSidebarState', () => ({
  useSidebarState: () => ({
    isOpen: false,
    toggleSidebar: vi.fn(),
    setSidebarOpen: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  default: (value: string) => value, // Return value immediately for testing
}));

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
  });

  describe('static rendering', () => {
    it('renders the header, footer, filters, and grid', () => {
      renderComponent();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('explore-filters')).toBeInTheDocument();
      expect(screen.getByTestId('explore-grid')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
    });

    it('renders the sort dropdown with "Newest" as the default label', () => {
      renderComponent();
      expect(screen.getByText('Newest')).toBeInTheDocument();
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
      // With debounce mocked to return immediately, empty string is passed to grid
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: ,');
    });

    it('pre-fills the search input from the q param', () => {
      renderComponent('/explore?q=tensorflow');
      const input = screen.getByPlaceholderText('searchPlaceholder');
      expect(input).toHaveValue('tensorflow');
    });

    it('passes the q param value as the grid query immediately', () => {
      renderComponent('/explore?q=tensorflow');
      // With debounce mocked, the query is passed through immediately
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: tensorflow');
    });

    it('handles a URL-encoded multi-word q param correctly', () => {
      renderComponent('/explore?q=machine%20learning');
      const input = screen.getByPlaceholderText('searchPlaceholder');
      expect(input).toHaveValue('machine learning');
      expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: machine learning');
    });

    it('handles a missing q param as an empty string', () => {
      renderComponent('/explore?sort=newest');
      const input = screen.getByPlaceholderText('searchPlaceholder');
      expect(input).toHaveValue('');
    });
  });

  describe('sort options', () => {
    it('updates the grid sort when "Oldest" is selected', async () => {
      renderComponent();
      const sortButton = screen.getByText('Newest');
      fireEvent.pointerDown(sortButton);

      await waitFor(() => {
        expect(screen.getByText('Oldest')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Oldest'));

      await waitFor(() => {
        expect(screen.getByTestId('explore-grid')).toHaveTextContent('{"lastUpdatedOn":"asc"}');
      });
    });
  });

  describe('filters', () => {
    it('passes updated filters down to ExploreGrid', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Update Filters'));
      expect(screen.getByTestId('explore-grid')).toHaveTextContent(
        'Filters: {"collections":["TestCollection"],"contentTypes":[],"categories":[]}'
      );
    });
  });
});
