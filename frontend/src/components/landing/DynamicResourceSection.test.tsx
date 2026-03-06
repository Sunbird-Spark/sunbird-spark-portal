import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DynamicResourceSection from './DynamicResourceSection';
import { useContentSearch } from '@/hooks/useContent';

vi.mock('@/hooks/useContent', () => ({
  useContentSearch: vi.fn(),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/content/ResourceCard', () => ({
  default: ({ item, heightClass }: any) => (
    <div data-testid="resource-card" data-height-class={heightClass}>
      {item.name}
    </div>
  ),
}));

describe('DynamicResourceSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useContentSearch as any).mockReturnValue({ isLoading: true });
    const { container } = render(
      <BrowserRouter>
        <DynamicResourceSection title="Test Resources" />
      </BrowserRouter>
    );
    expect(container.querySelector('.resource-section-skeleton')).toBeInTheDocument();
  });

  it('renders resource cards when data is loaded', () => {
    const mockData = {
      data: {
        content: [
          { identifier: '1', name: 'Resource 1', appIcon: 'icon1.png' },
          { identifier: '2', name: 'Resource 2', appIcon: 'icon2.png' },
          { identifier: '3', name: 'Resource 3', appIcon: 'icon3.png' },
        ]
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    render(
      <BrowserRouter>
        <DynamicResourceSection title="Popular Resources" criteria={{ request: {} } as any} />
      </BrowserRouter>
    );

    expect(screen.getByText('Popular Resources')).toBeInTheDocument();
    expect(screen.getByText('Resource 1')).toBeInTheDocument();
    expect(screen.getByText('Resource 2')).toBeInTheDocument();
    expect(screen.getByText('Resource 3')).toBeInTheDocument();
  });

  it('returns null on error', () => {
    (useContentSearch as any).mockReturnValue({ error: new Error('fail'), isLoading: false });
    const { container } = render(
      <BrowserRouter>
        <DynamicResourceSection title="Fail" />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when no content data', () => {
    (useContentSearch as any).mockReturnValue({ data: null, isLoading: false });
    const { container } = render(
      <BrowserRouter>
        <DynamicResourceSection title="No Data" />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders section label when sectionLabel prop is provided', () => {
    const mockData = {
      data: {
        content: [
          { identifier: '1', name: 'Resource 1', appIcon: 'icon1.png' },
        ]
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          sectionLabel="resource.header"
          criteria={{ request: {} } as any} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('resource.header')).toBeInTheDocument();
    const labelRow = screen.getByText('resource.header').closest('.resource-section-label-row');
    expect(labelRow).toBeInTheDocument();
  });

  it('does not render section label when sectionLabel prop is not provided', () => {
    const mockData = {
      data: {
        content: [
          { identifier: '1', name: 'Resource 1', appIcon: 'icon1.png' },
        ]
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    const { container } = render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          criteria={{ request: {} } as any} 
        />
      </BrowserRouter>
    );

    expect(container.querySelector('.resource-section-label-row')).not.toBeInTheDocument();
  });

  it('renders home skeleton variant when sectionClassName is resource-section-home', () => {
    (useContentSearch as any).mockReturnValue({ isLoading: true });
    
    const { container } = render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          sectionClassName="resource-section-home"
        />
      </BrowserRouter>
    );

    expect(container.querySelector('.resource-section-skeleton-home')).toBeInTheDocument();
    expect(container.querySelector('.resource-section-skeleton')).not.toBeInTheDocument();
  });

  it('renders default skeleton variant when sectionClassName is not resource-section-home', () => {
    (useContentSearch as any).mockReturnValue({ isLoading: true });
    
    const { container } = render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          sectionClassName="resource-section"
        />
      </BrowserRouter>
    );

    expect(container.querySelector('.resource-section-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.resource-section-skeleton-home')).not.toBeInTheDocument();
  });

  it('renders home skeleton variant when sectionClassName contains resource-section-home with other classes', () => {
    (useContentSearch as any).mockReturnValue({ isLoading: true });
    
    const { container } = render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          sectionClassName="resource-section-home foo bar"
        />
      </BrowserRouter>
    );

    expect(container.querySelector('.resource-section-skeleton-home')).toBeInTheDocument();
    expect(container.querySelector('.resource-section-skeleton')).not.toBeInTheDocument();
  });

  it('does not pass heightClass when useCustomHeights is false (default)', () => {
    const mockData = {
      data: {
        content: [
          { identifier: '1', name: 'Resource 1', appIcon: 'icon1.png' },
          { identifier: '2', name: 'Resource 2', appIcon: 'icon2.png' },
        ]
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          criteria={{ request: {} } as any}
          useCustomHeights={false}
        />
      </BrowserRouter>
    );

    const cards = screen.getAllByTestId('resource-card');
    expect(cards[0]).not.toHaveAttribute('data-height-class');
    expect(cards[1]).not.toHaveAttribute('data-height-class');
  });

  it('passes alternating heightClass when useCustomHeights is true', () => {
    const mockData = {
      data: {
        content: [
          { identifier: '1', name: 'Resource 1', appIcon: 'icon1.png' },
          { identifier: '2', name: 'Resource 2', appIcon: 'icon2.png' },
          { identifier: '3', name: 'Resource 3', appIcon: 'icon3.png' },
          { identifier: '4', name: 'Resource 4', appIcon: 'icon4.png' },
        ]
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          criteria={{ request: {} } as any}
          useCustomHeights={true}
        />
      </BrowserRouter>
    );

    const cards = screen.getAllByTestId('resource-card');
    // Column 0 (even): tall, short
    expect(cards[0]).toHaveAttribute('data-height-class', 'h-[28.6875rem]');
    expect(cards[1]).toHaveAttribute('data-height-class', 'h-[18.5rem]');
    // Column 1 (odd): short, tall
    expect(cards[2]).toHaveAttribute('data-height-class', 'h-[18.5rem]');
    expect(cards[3]).toHaveAttribute('data-height-class', 'h-[28.6875rem]');
  });

  it('maintains alternating pattern with odd number of cards', () => {
    const mockData = {
      data: {
        content: [
          { identifier: '1', name: 'Resource 1', appIcon: 'icon1.png' },
          { identifier: '2', name: 'Resource 2', appIcon: 'icon2.png' },
          { identifier: '3', name: 'Resource 3', appIcon: 'icon3.png' },
        ]
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          criteria={{ request: {} } as any}
          useCustomHeights={true}
        />
      </BrowserRouter>
    );

    const cards = screen.getAllByTestId('resource-card');
    // Column 0 (even): tall, short
    expect(cards[0]).toHaveAttribute('data-height-class', 'h-[28.6875rem]');
    expect(cards[1]).toHaveAttribute('data-height-class', 'h-[18.5rem]');
    // Column 1 (odd): short (only one item)
    expect(cards[2]).toHaveAttribute('data-height-class', 'h-[18.5rem]');
  });

  it('scales correctly with many cards', () => {
    const mockData = {
      data: {
        content: Array.from({ length: 10 }, (_, i) => ({
          identifier: `${i + 1}`,
          name: `Resource ${i + 1}`,
          appIcon: `icon${i + 1}.png`,
        }))
      }
    };
    (useContentSearch as any).mockReturnValue({ data: mockData, isLoading: false });

    render(
      <BrowserRouter>
        <DynamicResourceSection 
          title="Test Resources" 
          criteria={{ request: {} } as any}
          useCustomHeights={true}
        />
      </BrowserRouter>
    );

    const cards = screen.getAllByTestId('resource-card');
    // Component renders up to 6 items in 3 columns (2 items per column)
    expect(cards).toHaveLength(6);
    
    // Verify pattern for the 3 columns
    const expectedHeights = [
      'h-[28.6875rem]', 'h-[18.5rem]', // Column 0 (even)
      'h-[18.5rem]', 'h-[28.6875rem]', // Column 1 (odd)
      'h-[28.875rem]', 'h-[18.5rem]', // Column 2 (even)
    ];
    
    cards.forEach((card, index) => {
      expect(card).toHaveAttribute('data-height-class', expectedHeights[index]);
    });
  });
});
