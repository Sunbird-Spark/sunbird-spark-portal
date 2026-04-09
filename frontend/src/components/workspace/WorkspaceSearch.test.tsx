import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkspaceSearch from './WorkspaceSearch';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'workspace.searchPlaceholder': 'Search content',
        'workspace.clearSearch': 'Clear search',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('WorkspaceSearch', () => {
  const defaultProps = { query: '', onChange: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('closed state (empty query)', () => {
    it('renders search icon button when query is empty', () => {
      render(<WorkspaceSearch {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Search content' })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search content')).not.toBeInTheDocument();
    });

    it('shows input after clicking the search button', async () => {
      render(<WorkspaceSearch {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Search content' }));
      // The setTimeout(0) for focus runs after render; the input is visible immediately
      expect(screen.getByPlaceholderText('Search content')).toBeInTheDocument();
    });
  });

  describe('open state (non-empty query)', () => {
    it('renders input immediately when query is non-empty', () => {
      render(<WorkspaceSearch query="react" onChange={vi.fn()} />);
      expect(screen.getByPlaceholderText('Search content')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Search content' })).not.toBeInTheDocument();
    });

    it('calls onChange when user types in the input', () => {
      const onChange = vi.fn();
      render(<WorkspaceSearch query="react" onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText('Search content'), { target: { value: 'react hooks' } });
      expect(onChange).toHaveBeenCalledWith('react hooks');
    });

    it('clear button calls onChange with empty string and closes input', () => {
      const onChange = vi.fn();
      render(<WorkspaceSearch query="react" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
      expect(onChange).toHaveBeenCalledWith('');
      // After clearing, isOpen becomes false so search icon button appears
      expect(screen.getByRole('button', { name: 'Search content' })).toBeInTheDocument();
    });

    it('Escape key clears and closes search', () => {
      const onChange = vi.fn();
      render(<WorkspaceSearch query="react" onChange={onChange} />);
      fireEvent.keyDown(screen.getByPlaceholderText('Search content'), { key: 'Escape' });
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('non-Escape key does not trigger clear', () => {
      const onChange = vi.fn();
      render(<WorkspaceSearch query="react" onChange={onChange} />);
      fireEvent.keyDown(screen.getByPlaceholderText('Search content'), { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('useEffect – auto-close when parent clears query', () => {
    it('closes search bar when query is cleared from outside', () => {
      const { rerender } = render(<WorkspaceSearch query="react" onChange={vi.fn()} />);
      expect(screen.getByPlaceholderText('Search content')).toBeInTheDocument();

      rerender(<WorkspaceSearch query="" onChange={vi.fn()} />);

      expect(screen.queryByPlaceholderText('Search content')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Search content' })).toBeInTheDocument();
    });
  });
});
