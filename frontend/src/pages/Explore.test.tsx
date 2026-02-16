import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Explore from './Explore';

// Mock child components
vi.mock('../components/ExploreGrid', () => ({
  default: ({ query, sortBy, filters }: any) => (
    <div data-testid="explore-grid">
      Grid Query: {query}, Sort: {JSON.stringify(sortBy)}, Filters: {JSON.stringify(filters)}
    </div>
  ),
}));

vi.mock('../components/ExploreFilters', () => ({
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

describe('Explore Page', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Explore />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('renders page content after loading timeout', async () => {
    renderComponent();
    
    // Initially showing loading
    expect(screen.getByText('loading')).toBeInTheDocument();

    // Wait for loading to finish (component uses 500ms timeout)
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument(), { timeout: 2000 });

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('explore-filters')).toBeInTheDocument();
    expect(screen.getByTestId('explore-grid')).toBeInTheDocument();
  });

  it('updates search query on input', async () => {
    renderComponent();
    // Wait for loading to finish
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument(), { timeout: 2000 });

    const input = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Simulate Enter key to set active search query
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByTestId('explore-grid')).toHaveTextContent('Grid Query: test query');
  });

  it('updates sort options', async () => {
    renderComponent();
    // Wait for loading to finish
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument(), { timeout: 2000 });

    // Debugging: check if button exists
    const sortButton = screen.getByText('Newest');
    // Radix UI often responds to pointer events
    fireEvent.pointerDown(sortButton);

    // Radix UI dropdowns might render in a portal or require specific interaction
    // The previous error was "Unable to find an element with the text: Oldest"
    // We can try to await for it to appear
    await waitFor(() => {
        expect(screen.getByText('Oldest')).toBeInTheDocument();
    });

    const oldestOption = screen.getByText('Oldest');
    fireEvent.click(oldestOption);

    await waitFor(() => {
         expect(screen.getByTestId('explore-grid')).toHaveTextContent('{"lastUpdatedOn":"asc"}');
    });
  });

  it('updates filters from child component', async () => {
    renderComponent();
    // Wait for loading to finish
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument(), { timeout: 2000 });

    const updateFilterButton = screen.getByText('Update Filters');
    fireEvent.click(updateFilterButton);

    expect(screen.getByTestId('explore-grid')).toHaveTextContent('Filters: {"collections":["TestCollection"],"contentTypes":[],"categories":[]}');
  });
});
