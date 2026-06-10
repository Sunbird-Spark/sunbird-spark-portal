import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import SearchModeToggle from './SearchModeToggle';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'search_for_content_placeholder': 'Search for content...',
        'clear_search': 'Clear search',
        'search.keywordMode': 'Keyword',
        'search.semanticMode': 'AI Search',
      };
      return map[key] ?? key;
    },
  }),
}));

const defaultProps = {
  query: '',
  onQueryChange: vi.fn(),
  searchMode: 'keyword' as const,
  onModeChange: vi.fn(),
};

describe('SearchModeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the text input', () => {
    render(<SearchModeToggle {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows the provided query value in the input', () => {
    render(<SearchModeToggle {...defaultProps} query="hello" />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('calls onQueryChange when typing', () => {
    render(<SearchModeToggle {...defaultProps} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'maths' } });
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith('maths');
  });

  it('uses placeholder prop when provided', () => {
    render(<SearchModeToggle {...defaultProps} placeholder="Custom placeholder" />);
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('falls back to i18n placeholder when no placeholder prop', () => {
    render(<SearchModeToggle {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search for content...')).toBeInTheDocument();
  });

  // ── Clear button ────────────────────────────────────────────────────────────

  it('does not show clear button when query is empty', () => {
    render(<SearchModeToggle {...defaultProps} query="" />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('shows clear button when query is non-empty', () => {
    render(<SearchModeToggle {...defaultProps} query="test" />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('calls onQueryChange with empty string when clear button is clicked', () => {
    render(<SearchModeToggle {...defaultProps} query="test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith('');
  });

  // ── Mode pills ──────────────────────────────────────────────────────────────

  it('renders only the AI Search toggle button (no Keyword pill)', () => {
    render(<SearchModeToggle {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /keyword/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ai search/i })).toBeInTheDocument();
  });

  it('marks AI Search pill as not pressed in keyword mode', () => {
    render(<SearchModeToggle {...defaultProps} searchMode="keyword" />);
    expect(screen.getByRole('button', { name: /ai search/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks AI Search pill as pressed in semantic mode', () => {
    render(<SearchModeToggle {...defaultProps} searchMode="semantic" />);
    expect(screen.getByRole('button', { name: /ai search/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onModeChange("keyword") when AI Search is clicked while in semantic mode', () => {
    render(<SearchModeToggle {...defaultProps} searchMode="semantic" />);
    fireEvent.click(screen.getByRole('button', { name: /ai search/i }));
    expect(defaultProps.onModeChange).toHaveBeenCalledWith('keyword');
  });

  it('calls onModeChange("semantic") when AI Search pill is clicked', () => {
    render(<SearchModeToggle {...defaultProps} searchMode="keyword" />);
    fireEvent.click(screen.getByRole('button', { name: /ai search/i }));
    expect(defaultProps.onModeChange).toHaveBeenCalledWith('semantic');
  });

  // ── Icon ────────────────────────────────────────────────────────────────────

  it('renders a search icon container in keyword mode', () => {
    const { container } = render(<SearchModeToggle {...defaultProps} searchMode="keyword" />);
    // FiSearch renders an svg; sparkle is also an svg — keyword mode should NOT have the animate-pulse class
    const iconSpan = container.querySelector('span.flex-shrink-0');
    expect(iconSpan).not.toHaveClass('text-sunbird-brick');
    expect(iconSpan).toHaveClass('text-gray-400');
  });

  it('renders a pulsing sparkle icon in AI Search mode', () => {
    const { container } = render(<SearchModeToggle {...defaultProps} searchMode="semantic" />);
    const iconSpan = container.querySelector('span.flex-shrink-0');
    expect(iconSpan).toHaveClass('text-sunbird-brick');
    expect(iconSpan).toHaveClass('animate-pulse');
  });

  // ── Forwarded ref ───────────────────────────────────────────────────────────

  it('forwards ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchModeToggle {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
