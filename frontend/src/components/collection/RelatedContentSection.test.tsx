import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RelatedContentSection from './RelatedContentSection';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message, error, onRetry }: { message?: string; error?: string; onRetry?: () => void }) => (
    <div data-testid="page-loader">
      {message && <span data-testid="loader-message">{message}</span>}
      {error && <span data-testid="loader-error">{error}</span>}
      {onRetry && <button data-testid="retry-btn" onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

vi.mock('@/components/common/RelatedContent', () => ({
  default: ({ items, cardType }: { items: any[]; cardType: string }) => (
    <div data-testid="related-content">
      {items.map((item: any, i: number) => (
        <div key={i} data-testid="related-item">{item.name}</div>
      ))}
    </div>
  ),
}));

const defaultProps = {
  searchError: false,
  searchErrorObj: null,
  searchFetching: false,
  relatedContentItems: [],
  searchRefetch: vi.fn(),
  linkState: {},
};

describe('RelatedContentSection', () => {
  it('renders RelatedContent when items are available and not in error state', () => {
    render(
      <RelatedContentSection
        {...defaultProps}
        relatedContentItems={[{ name: 'Item 1' }, { name: 'Item 2' }]}
      />
    );
    expect(screen.getByTestId('related-content')).toBeInTheDocument();
    expect(screen.getAllByTestId('related-item')).toHaveLength(2);
  });

  it('renders RelatedContent when not fetching and items are empty', () => {
    render(<RelatedContentSection {...defaultProps} />);
    expect(screen.getByTestId('related-content')).toBeInTheDocument();
  });

  it('shows loading PageLoader when fetching and no items yet (covers line 33)', () => {
    render(
      <RelatedContentSection
        {...defaultProps}
        searchFetching={true}
        relatedContentItems={[]}
      />
    );
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('loader-message')).toHaveTextContent('loading');
  });

  it('shows related-content header when fetching with no items', () => {
    render(
      <RelatedContentSection
        {...defaultProps}
        searchFetching={true}
        relatedContentItems={[]}
      />
    );
    expect(screen.getByText('courseDetails.relatedContent')).toBeInTheDocument();
  });

  it('shows error PageLoader when searchError is true and searchErrorObj is set', () => {
    const error = new Error('Failed to fetch');
    render(
      <RelatedContentSection
        {...defaultProps}
        searchError={true}
        searchErrorObj={error}
        relatedContentItems={[]}
      />
    );
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('loader-error')).toHaveTextContent('Failed to fetch');
  });

  it('calls searchRefetch when retry is clicked in error state', () => {
    const mockRefetch = vi.fn();
    const error = new Error('Network error');
    render(
      <RelatedContentSection
        {...defaultProps}
        searchError={true}
        searchErrorObj={error}
        searchRefetch={mockRefetch}
        relatedContentItems={[]}
      />
    );
    fireEvent.click(screen.getByTestId('retry-btn'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows error header when searchError is true', () => {
    render(
      <RelatedContentSection
        {...defaultProps}
        searchError={true}
        searchErrorObj={new Error('err')}
        relatedContentItems={[]}
      />
    );
    expect(screen.getByText('courseDetails.relatedContent')).toBeInTheDocument();
  });

  it('does not show error loader when searchError is false even if searchErrorObj is set', () => {
    render(
      <RelatedContentSection
        {...defaultProps}
        searchError={false}
        searchErrorObj={new Error('ignored')}
        relatedContentItems={[{ name: 'Item' }]}
      />
    );
    expect(screen.queryByTestId('loader-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('related-content')).toBeInTheDocument();
  });

  it('does not show loading PageLoader when fetching but items already present', () => {
    render(
      <RelatedContentSection
        {...defaultProps}
        searchFetching={true}
        relatedContentItems={[{ name: 'Existing Item' }]}
      />
    );
    // Header should not appear since relatedContentItems.length > 0
    expect(screen.queryByTestId('loader-message')).not.toBeInTheDocument();
    // RelatedContent should be shown
    expect(screen.getByTestId('related-content')).toBeInTheDocument();
  });
});
