import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel from './FilterPanel';

const filters = [
  {
    key: 'progress',
    label: 'Progress',
    options: [
      { label: '0–25%', value: '0-25' },
      { label: '25–50%', value: '25-50' },
    ],
  },
];

describe('FilterPanel', () => {
  it('renders search input when onSearchChange provided', () => {
    render(
      <FilterPanel
        filters={[]}
        values={{}}
        onChange={vi.fn()}
        searchValue=""
        onSearchChange={vi.fn()}
        searchPlaceholder="Search learners…"
      />
    );
    expect(screen.getByPlaceholderText('Search learners…')).toBeInTheDocument();
  });

  it('does not render search input when onSearchChange not provided', () => {
    render(
      <FilterPanel
        filters={[]}
        values={{}}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search', () => {
    const onSearchChange = vi.fn();
    render(
      <FilterPanel
        filters={[]}
        values={{}}
        onChange={vi.fn()}
        searchValue=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Search…"
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'Alice' } });
    expect(onSearchChange).toHaveBeenCalledWith('Alice');
  });

  it('renders filter select trigger for each filter', () => {
    render(
      <FilterPanel
        filters={filters}
        values={{}}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Progress')).toBeInTheDocument();
  });

  it('renders no filter selects when filters array is empty', () => {
    render(
      <FilterPanel
        filters={[]}
        values={{}}
        onChange={vi.fn()}
      />
    );
    // no select triggers
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('uses default search placeholder', () => {
    render(
      <FilterPanel
        filters={[]}
        values={{}}
        onChange={vi.fn()}
        searchValue=""
        onSearchChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });
});
