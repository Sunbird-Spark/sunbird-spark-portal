import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchModal from './SearchModal';

// --------------------
// Mocks
// --------------------

// Mock useDebounce to return the value immediately — no artificial delays needed in these tests
vi.mock('@/hooks/useDebounce', () => ({
  default: (value: string) => value,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'search_for_content_placeholder': 'Search for content...',
        'recommended': 'Recommended',
        'cancel': 'Cancel',
        'no_results_found': 'No results found',
        'clear_search': 'Clear search',
        'view_all_results': 'View All Results',
        'loading': 'Loading...',
        'failed_to_search': 'Failed to search',
      };
      if (key === 'results_for' && params?.query) {
        return `Results for "${params.query}"`;
      }
      return translations[key] || key;
    },
  }),
}));

const { mockUseContentSearch } = vi.hoisted(() => ({
  mockUseContentSearch: vi.fn(),
}));

vi.mock('@/hooks/useContent', () => ({
  useContentSearch: mockUseContentSearch,
}));

// Mock the card components
vi.mock('@/components/content/CollectionCard', () => ({
  default: ({ item }: { item: { name: string; primaryCategory: string } }) => (
    <div data-testid="collection-card">
      <div>{item.name}</div>
      <div>{item.primaryCategory}</div>
    </div>
  ),
}));

vi.mock('@/components/content/ResourceCard', () => ({
  default: ({ item }: { item: { name: string } }) => (
    <div data-testid="resource-card">
      <div>{item.name}</div>
    </div>
  ),
}));

// --------------------
// Helpers
// --------------------

const mockOnClose = vi.fn();

const twoResults = [
  { identifier: 'id-1', name: 'Course Alpha', primaryCategory: 'Course', appIcon: '' },
  { identifier: 'id-2', name: 'Textbook Beta', primaryCategory: 'Textbook', appIcon: '' },
];

const emptyResponse = { data: { data: { content: [] } }, isLoading: false };
const loadingResponse = { data: null, isLoading: true };
const withResults = (content: object[]) => ({
  data: { data: { content } },
  isLoading: false,
});

const renderModal = (isOpen = true) =>
  render(
    <MemoryRouter>
      <SearchModal isOpen={isOpen} onClose={mockOnClose} />
    </MemoryRouter>
  );

// --------------------
// Tests
// --------------------

describe('SearchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentSearch.mockReturnValue(emptyResponse);
  });

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      renderModal(false);
      expect(screen.queryByPlaceholderText('Search for content...')).not.toBeInTheDocument();
    });

    it('renders the search panel when isOpen is true', () => {
      renderModal();
      expect(screen.getByPlaceholderText('Search for content...')).toBeInTheDocument();
    });
  });

  describe('dismissal', () => {
    it('calls onClose when the Cancel button is clicked', () => {
      renderModal();
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the Escape key is pressed', () => {
      renderModal();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the dimmed backdrop is clicked', () => {
      const { container } = renderModal();
      // The backdrop is the last child of the outer fixed container
      const outerContainer = container.firstChild as HTMLElement;
      const backdrop = outerContainer.lastElementChild as HTMLElement;
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('removes the Escape key listener when the modal closes', () => {
      const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { rerender } = renderModal(true);
      rerender(
        <MemoryRouter>
          <SearchModal isOpen={false} onClose={mockOnClose} />
        </MemoryRouter>
      );
      expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeListenerSpy.mockRestore();
    });
  });

  describe('loading and results', () => {
    it('shows a loading spinner while the API is fetching', () => {
      mockUseContentSearch.mockReturnValue(loadingResponse);
      const { container } = renderModal();
      expect(container.querySelector('[data-testid="page-loader"]')).toBeInTheDocument();
    });

    it('shows "No results found." when the API returns an empty array', () => {
      mockUseContentSearch.mockReturnValue(emptyResponse);
      renderModal();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('renders a card for each result returned by the API', () => {
      mockUseContentSearch.mockReturnValue(withResults(twoResults));
      renderModal();
      expect(screen.getByText('Course Alpha')).toBeInTheDocument();
      expect(screen.getByText('Textbook Beta')).toBeInTheDocument();
    });

    it('does not show the spinner once loading is complete', () => {
      mockUseContentSearch.mockReturnValue(emptyResponse);
      const { container } = renderModal();
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  describe('section title', () => {
    it('shows "Recommended" when no query has been typed', () => {
      renderModal();
      expect(screen.getByRole('heading', { name: 'Recommended' })).toBeInTheDocument();
    });

    it('shows \'Results for "..."\' when the user types a query', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Search for content...'), {
        target: { value: 'Eng' },
      });
      expect(screen.getByRole('heading', { name: 'Results for "Eng"' })).toBeInTheDocument();
    });

    it('reverts to "Recommended" after the query is cleared', () => {
      renderModal();
      const input = screen.getByPlaceholderText('Search for content...');
      fireEvent.change(input, { target: { value: 'Eng' } });
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByRole('heading', { name: 'Recommended' })).toBeInTheDocument();
    });
  });

  describe('search input behaviour', () => {
    it('does not show the clear button when the input is empty', () => {
      renderModal();
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('shows the clear button when the user has typed something', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Search for content...'), {
        target: { value: 'test' },
      });
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears the input value when the clear button is clicked', () => {
      renderModal();
      const input = screen.getByPlaceholderText('Search for content...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(screen.getByLabelText('Clear search'));
      expect(input).toHaveValue('');
    });

    it('hides the clear button after clearing the input', () => {
      renderModal();
      const input = screen.getByPlaceholderText('Search for content...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(screen.getByLabelText('Clear search'));
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });
  });

  describe('API call parameters', () => {
    it('calls useContentSearch with limit 3 and objectType filter', () => {
      renderModal();
      expect(mockUseContentSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            limit: 3,
            filters: { objectType: ['Content', 'QuestionSet'] },
          }),
        })
      );
    });

    it('passes enabled:true to useContentSearch when the modal is open', () => {
      renderModal(true);
      expect(mockUseContentSearch).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });

    it('passes enabled:false to useContentSearch when the modal is closed', () => {
      renderModal(false);
      expect(mockUseContentSearch).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });

    it('sends the typed query to useContentSearch', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Search for content...'), {
        target: { value: 'machine learning' },
      });
      expect(mockUseContentSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({ query: 'machine learning' }),
        })
      );
    });
  });

  describe('"View All Results" button', () => {
    beforeEach(() => {
      mockUseContentSearch.mockReturnValue(withResults(twoResults));
    });

    it('is visible when results are present', () => {
      renderModal();
      expect(screen.getByText('View All Results')).toBeInTheDocument();
    });

    it('navigates to /explore with the encoded query on click', () => {
      renderModal();
      fireEvent.change(screen.getByPlaceholderText('Search for content...'), {
        target: { value: 'machine learning' },
      });
      fireEvent.click(screen.getByText('View All Results'));
      expect(mockNavigate).toHaveBeenCalledWith('/explore?q=machine%20learning');
    });

    it('calls onClose when "View All Results" is clicked', () => {
      renderModal();
      fireEvent.click(screen.getByText('View All Results'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('is not visible when results are empty', () => {
      mockUseContentSearch.mockReturnValue(emptyResponse);
      renderModal();
      expect(screen.queryByText('View All Results')).not.toBeInTheDocument();
    });
  });

  describe('result card navigation', () => {
    it('calls onClose when a result card link is clicked', () => {
      mockUseContentSearch.mockReturnValue(
        withResults([{ identifier: 'xyz', name: 'Click Me', primaryCategory: 'Course', appIcon: '' }])
      );
      renderModal();
      fireEvent.click(screen.getByText('Click Me'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper dialog role and aria attributes', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Search for content...');
    });

    it('focuses the search input when modal opens', () => {
      renderModal();
      const input = screen.getByPlaceholderText('Search for content...');
      expect(input).toHaveFocus();
    });

    it('restores focus to previously focused element when modal closes', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      expect(button).toHaveFocus();

      const { rerender } = renderModal(true);
      const input = screen.getByPlaceholderText('Search for content...');
      expect(input).toHaveFocus();

      rerender(
        <MemoryRouter>
          <SearchModal isOpen={false} onClose={mockOnClose} />
        </MemoryRouter>
      );

      expect(button).toHaveFocus();
      document.body.removeChild(button);
    });

    it('traps focus within the modal when tabbing forward', () => {
      mockUseContentSearch.mockReturnValue(withResults(twoResults));
      renderModal();

      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      lastElement.focus();
      expect(lastElement).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(firstElement).toHaveFocus();
    });

    it('traps focus within the modal when tabbing backward', () => {
      mockUseContentSearch.mockReturnValue(withResults(twoResults));
      renderModal();

      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      firstElement.focus();
      expect(firstElement).toHaveFocus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(lastElement).toHaveFocus();
    });

    it('backdrop has aria-hidden attribute', () => {
      const { container } = renderModal();
      const dialog = container.firstChild as HTMLElement;
      const backdrop = dialog.lastElementChild as HTMLElement;
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });

    it('clears query when modal closes', () => {
      const { rerender } = renderModal(true);
      const input = screen.getByPlaceholderText('Search for content...');

      fireEvent.change(input, { target: { value: 'test query' } });
      expect(input).toHaveValue('test query');

      rerender(
        <MemoryRouter>
          <SearchModal isOpen={false} onClose={mockOnClose} />
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter>
          <SearchModal isOpen={true} onClose={mockOnClose} />
        </MemoryRouter>
      );

      const newInput = screen.getByPlaceholderText('Search for content...');
      expect(newInput).toHaveValue('');
    });
  });
});
