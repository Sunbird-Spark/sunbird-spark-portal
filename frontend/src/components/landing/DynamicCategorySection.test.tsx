import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DynamicCategorySection from './DynamicCategorySection';

describe('DynamicCategorySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no list provided', () => {
    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when empty list provided', () => {
    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={[]} />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders category cards when list is provided', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'UI/UX Design', code: 'technology', value: 'UI/UX Design' },
      { id: 'cat2', index: 2, title: 'IT Development', code: 'technology', value: 'IT Development' },
    ];

    render(
      <BrowserRouter>
        <DynamicCategorySection title="Browse Categories" list={mockCategories} />
      </BrowserRouter>
    );

    expect(screen.getByText('Browse Categories')).toBeInTheDocument();
    expect(screen.getByText('UI/UX Design')).toBeInTheDocument();
    expect(screen.getByText('IT Development')).toBeInTheDocument();
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('sorts categories by index', () => {
    const mockCategories = [
      { id: 'cat2', index: 2, title: 'Second', code: 'tech', value: 'Second' },
      { id: 'cat1', index: 1, title: 'First', code: 'tech', value: 'First' },
      { id: 'cat3', index: 3, title: 'Third', code: 'tech', value: 'Third' },
    ];

    render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const categoryElements = screen.getAllByRole('link').filter(link => 
      link.textContent?.includes('First') || 
      link.textContent?.includes('Second') || 
      link.textContent?.includes('Third')
    );

    expect(categoryElements[0]).toHaveTextContent('First');
    expect(categoryElements[1]).toHaveTextContent('Second');
    expect(categoryElements[2]).toHaveTextContent('Third');
  });
});
