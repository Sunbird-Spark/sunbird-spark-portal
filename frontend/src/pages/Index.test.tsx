import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Index from './Index';
import { useFormRead } from '@/hooks/useForm';

// Mock hooks
vi.mock('@/hooks/useForm', () => ({
  useFormRead: vi.fn(),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'index.loadingSections': 'Loading sections...',
        'index.errorLoadingSections': 'Unable to load content sections. Please try again.',
        'index.noSectionsAvailable': 'No content sections available at the moment.'
      };
      return map[key] || key;
    },
  }),
}));

// Mock components
vi.mock('@/components/home/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('@/components/landing/HeroWithStats', () => ({ default: () => <div data-testid="hero">Hero</div> }));
vi.mock('@/components/landing/FAQSection', () => ({ default: () => <div data-testid="faq">FAQ</div> }));
vi.mock('@/components/home/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));
vi.mock('@/components/common/PageLoader', () => ({ 
  default: ({ message, error, onRetry }: any) => (
    <div data-testid="page-loader">
      {message && <div>{message}</div>}
      {error && <div>{error}</div>}
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ) 
}));
vi.mock('@/components/landing/DynamicContentSection', () => ({ default: ({ title }: any) => <div data-testid="content-section">{title}</div> }));
vi.mock('@/components/landing/DynamicCategorySection', () => ({ default: ({ title }: any) => <div data-testid="category-section">{title}</div> }));
vi.mock('@/components/landing/DynamicResourceSection', () => ({ default: ({ title }: any) => <div data-testid="resource-section">{title}</div> }));

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with PageLoader', () => {
    (useFormRead as any).mockReturnValue({ 
      isLoading: true,
      error: null,
      refetch: vi.fn()
    });
    
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    
    // Should show header, hero, and FAQ even during loading
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Should show loading message in sections area
    expect(screen.getByText(/Loading sections.../i)).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    const mockRefetch = vi.fn();
    (useFormRead as any).mockReturnValue({ 
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch
    });
    
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
    
    // Should show header, hero, and FAQ even during error
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Should show error message
    expect(screen.getByText(/Unable to load content sections/i)).toBeInTheDocument();
    
    // Should have retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    await userEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no sections available', () => {
    const mockFormData = {
      data: {
        form: {
          data: {
            sections: []
          }
        }
      }
    };
    
    (useFormRead as any).mockReturnValue({ 
      data: mockFormData,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Should show header, hero, and FAQ
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    // Should show empty state message
    expect(screen.getByText(/No content sections available/i)).toBeInTheDocument();
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
    (useFormRead as any).mockReturnValue({ 
      data: mockFormData,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

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

  it('renders all layout components with sections', () => {
    const mockFormData = {
      data: {
        form: {
          data: {
            sections: [
              { id: 'sec1', index: 1, title: 'Popular', type: 'content', criteria: {} }
            ]
          }
        }
      }
    };
    
    (useFormRead as any).mockReturnValue({ 
      data: mockFormData,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // All layout components should be present
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('faq')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('content-section')).toBeInTheDocument();
  });
});
