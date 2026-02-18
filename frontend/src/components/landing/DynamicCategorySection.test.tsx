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

  it('renders correct number of category cards', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'UI/UX Design', code: 'technology', value: 'UI/UX Design' },
      { id: 'cat2', index: 2, title: 'IT Development', code: 'technology', value: 'IT Development' },
      { id: 'cat3', index: 3, title: 'Digital Marketing', code: 'marketing', value: 'Digital Marketing' },
      { id: 'cat4', index: 4, title: 'Entrepreneurship', code: 'business', value: 'Entrepreneurship' },
    ];

    render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    // Should have 4 category cards + 1 "View All" link = 5 total links
    const allLinks = screen.getAllByRole('link');
    expect(allLinks).toHaveLength(5);
  });

  it('applies correct gradient backgrounds to category cards', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'Category 1', code: 'tech', value: 'Category 1' },
      { id: 'cat2', index: 2, title: 'Category 2', code: 'tech', value: 'Category 2' },
    ];

    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const categoryCards = container.querySelectorAll('[style*="background"]');
    expect(categoryCards.length).toBeGreaterThan(0);
    
    const firstCardStyle = (categoryCards[0] as HTMLElement).style.background;
    expect(firstCardStyle).toContain('var(--category-gradient-');
  });

  it('renders fallback icon for unknown category', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'Unknown Category', code: 'unknown', value: 'Unknown Category' },
    ];

    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute('alt', 'Unknown Category');
  });

  it('uses code field for icon mapping', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'Tech Category', code: 'technology', value: 'Tech' },
      { id: 'cat2', index: 2, title: 'Design Category', code: 'design', value: 'Design' },
    ];

    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('alt', 'Tech Category');
    expect(images[1]).toHaveAttribute('alt', 'Design Category');
  });

  it('handles case-insensitive code matching', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'Tech', code: 'TECHNOLOGY', value: 'Tech' },
      { id: 'cat2', index: 2, title: 'Marketing', code: 'Marketing', value: 'Marketing' },
    ];

    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);
    // Should successfully map icons despite different casing
    expect(images[0]).toHaveAttribute('src');
    expect(images[1]).toHaveAttribute('src');
  });

  it('renders all links with correct href to /explore', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'UI/UX Design', code: 'technology', value: 'UI/UX Design' },
    ];

    render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href', '/explore');
    });
  });

  it('handles single category correctly', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'Single Category', code: 'tech', value: 'Single Category' },
    ];

    render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    expect(screen.getByText('Single Category')).toBeInTheDocument();
    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('cycles through background gradients for multiple categories', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'Cat 1', code: 'tech', value: 'Cat 1' },
      { id: 'cat2', index: 2, title: 'Cat 2', code: 'tech', value: 'Cat 2' },
      { id: 'cat3', index: 3, title: 'Cat 3', code: 'tech', value: 'Cat 3' },
      { id: 'cat4', index: 4, title: 'Cat 4', code: 'tech', value: 'Cat 4' },
      { id: 'cat5', index: 5, title: 'Cat 5', code: 'tech', value: 'Cat 5' },
    ];

    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const categoryCards = container.querySelectorAll('[style*="background"]');
    // Should have 5 cards with cycling backgrounds (4 gradient patterns)
    expect(categoryCards).toHaveLength(5);
  });

  it('renders section with correct styling classes', () => {
    const mockCategories = [
      { id: 'cat1', index: 1, title: 'UI/UX Design', code: 'technology', value: 'UI/UX Design' },
    ];

    const { container } = render(
      <BrowserRouter>
        <DynamicCategorySection title="Categories" list={mockCategories} />
      </BrowserRouter>
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('pt-[2.5rem]', 'pb-8', 'bg-white');
  });
});
