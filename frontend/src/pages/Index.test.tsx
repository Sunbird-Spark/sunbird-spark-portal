import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from './Index';
import { useFormRead } from '@/hooks/useForm';

// Mock hooks
vi.mock('@/hooks/useForm', () => ({
  useFormRead: vi.fn(),
}));

// Mock components
vi.mock('@/components/home/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('@/components/landing/HeroWithStats', () => ({ default: () => <div data-testid="hero">Hero</div> }));
vi.mock('@/components/landing/FAQSection', () => ({ default: () => <div data-testid="faq">FAQ</div> }));
vi.mock('@/components/home/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));
vi.mock('@/components/landing/DynamicContentSection', () => ({ default: ({ title }: any) => <div data-testid="content-section">{title}</div> }));
vi.mock('@/components/landing/DynamicCategorySection', () => ({ default: ({ title }: any) => <div data-testid="category-section">{title}</div> }));
vi.mock('@/components/landing/DynamicResourceSection', () => ({ default: ({ title }: any) => <div data-testid="resource-section">{title}</div> }));

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useFormRead as any).mockReturnValue({ isLoading: true });
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    expect(screen.getByText(/Loading Sunbird.../i)).toBeInTheDocument();
  });

  it('renders dynamic sections in correct order', () => {
    const mockFormData = {
      data: {
        form: {
          data: {
            sections: [
              { id: 'sec2', index: 2, title: 'Categories', type: 'categories', list: [] },
              { id: 'sec1', index: 1, title: 'Popular', type: 'content', criteria: {} },
              { id: 'sec3', index: 3, title: 'Resources', type: 'resources', criteria: {} },
            ]
          }
        }
      }
    };
    (useFormRead as any).mockReturnValue({ data: mockFormData, isLoading: false });

    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    const contentSection = screen.getByTestId('content-section');
    const categorySection = screen.getByTestId('category-section');
    const resourceSection = screen.getByTestId('resource-section');
    
    expect(contentSection).toHaveTextContent('Popular');
    expect(categorySection).toHaveTextContent('Categories');
    expect(resourceSection).toHaveTextContent('Resources');
    
    // Verify order: content should come before category
    expect(
      contentSection.compareDocumentPosition(categorySection) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    
    // Verify order: category should come before resource
    expect(
      categorySection.compareDocumentPosition(resourceSection) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
