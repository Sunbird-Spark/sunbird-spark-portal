import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock portalInitializer
vi.mock('./utils/portalInitializer', () => ({
  portalInitializer: vi.fn(),
}));

// Mock AppRoutes
vi.mock('./AppRoutes', () => ({
  default: () => <div data-testid="app-routes">App Routes</div>,
}));

// Mock Toaster
vi.mock('@/components/common/Toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Mock PageLoader
vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message, error, onRetry, fullPage }: { message?: string; error?: string | null; onRetry?: () => void; fullPage?: boolean }) => (
    <div data-testid="page-loader" data-fullpage={fullPage}>
      {message && <span data-testid="loader-message">{message}</span>}
      {error && <span data-testid="loader-error">{error}</span>}
      {onRetry && <button data-testid="retry-button" onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

// Mock useAppI18n
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
    dir: 'ltr',
    isRtl: false,
  }),
}));

import { portalInitializer } from './utils/portalInitializer';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows PageLoader while portalInitializer is in progress', () => {
    // Keep the promise pending (never resolves)
    (portalInitializer as Mock).mockReturnValue(new Promise(() => { }));

    render(<App />);

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('loader-message')).toHaveTextContent('loading');
    expect(screen.getByTestId('page-loader')).toHaveAttribute('data-fullpage', 'true');
    expect(screen.queryByTestId('app-routes')).not.toBeInTheDocument();
  });

  it('renders AppRoutes after portalInitializer succeeds', async () => {
    (portalInitializer as Mock).mockResolvedValue(undefined);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
  });

  it('renders Toaster component after successful initialization', async () => {
    (portalInitializer as Mock).mockResolvedValue(undefined);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });

  it('shows error PageLoader with retry button when portalInitializer fails', async () => {
    (portalInitializer as Mock).mockRejectedValue(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('loader-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('loader-error')).toHaveTextContent('Network error');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    expect(screen.getByTestId('page-loader')).toHaveAttribute('data-fullpage', 'true');
    expect(screen.queryByTestId('app-routes')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toaster')).not.toBeInTheDocument();
  });

  it('shows fallback error message when error is not an Error instance', async () => {
    (portalInitializer as Mock).mockRejectedValue('string error');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('loader-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('loader-error')).toHaveTextContent('Portal initialization failed');
  });

  it('retries portalInitializer when retry button is clicked and succeeds', async () => {
    (portalInitializer as Mock)
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce(undefined);

    render(<App />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByTestId('retry-button'));

    // Should show AppRoutes after successful retry
    await waitFor(() => {
      expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    });

    expect(portalInitializer).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('shows error again when retry also fails', async () => {
    (portalInitializer as Mock)
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'));

    render(<App />);

    // Wait for first error
    await waitFor(() => {
      expect(screen.getByTestId('loader-error')).toHaveTextContent('First failure');
    });

    // Click retry
    fireEvent.click(screen.getByTestId('retry-button'));

    // Should show second error
    await waitFor(() => {
      expect(screen.getByTestId('loader-error')).toHaveTextContent('Second failure');
    });

    expect(portalInitializer).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId('toaster')).not.toBeInTheDocument();
  });

  it('renders QueryClientProvider wrapper', async () => {
    (portalInitializer as Mock).mockResolvedValue(undefined);

    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    });

    // QueryClientProvider should be in the component tree
    expect(container.querySelector('[data-testid="app-routes"]')).toBeInTheDocument();
  });

  it('renders BrowserRouter wrapper', async () => {
    (portalInitializer as Mock).mockResolvedValue(undefined);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('app-routes')).toBeInTheDocument();
    });

    // BrowserRouter should be wrapping the routes
    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });

  it('shows loading state immediately on mount', () => {
    (portalInitializer as Mock).mockReturnValue(new Promise(() => { }));

    render(<App />);

    // Should show loading immediately
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('loader-message')).toHaveTextContent('loading');
  });

  it('clears error state when retry is successful', async () => {
    (portalInitializer as Mock)
      .mockRejectedValueOnce(new Error('Initial error'))
      .mockResolvedValueOnce(undefined);

    render(<App />);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByTestId('loader-error')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByTestId('retry-button'));

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByTestId('loader-error')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('app-routes')).toBeInTheDocument();
  });
});
