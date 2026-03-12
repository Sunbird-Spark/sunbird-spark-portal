import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        authErrorRedirectMessage: "You don't have access to perform this action. Logging out.",
      };
      return map[key] ?? key;
    },
  }),
}));

describe('UnauthorizedHandler', () => {
  // Reset modules before each test so the module-level `redirectScheduled`
  // flag starts as false for every test.
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderComponent = async () => {
    const { default: UnauthorizedHandler } = await import('./UnauthorizedHandler');
    return render(<UnauthorizedHandler />);
  };

  it('renders nothing initially', async () => {
    await renderComponent();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows message when unauthorized event is dispatched', async () => {
    await renderComponent();

    act(() => { window.dispatchEvent(new CustomEvent('unauthorized')); });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText("You don't have access to perform this action. Logging out.")).toBeInTheDocument();
  });

  it('shows message when forbidden event is dispatched', async () => {
    await renderComponent();

    act(() => { window.dispatchEvent(new CustomEvent('forbidden')); });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText("You don't have access to perform this action. Logging out.")).toBeInTheDocument();
  });

  it('has correct ARIA attributes', async () => {
    await renderComponent();

    act(() => { window.dispatchEvent(new CustomEvent('unauthorized')); });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby', 'auth-error-message');
    expect(document.getElementById('auth-error-message')).toBeInTheDocument();
  });

  it('redirects to /portal/logout after 2.5s', async () => {
    await renderComponent();

    act(() => { window.dispatchEvent(new CustomEvent('unauthorized')); });
    act(() => { vi.advanceTimersByTime(2500); });

    expect(window.location.href).toBe('/portal/logout');
  });

  it('does not redirect before 2.5s have elapsed', async () => {
    await renderComponent();

    act(() => { window.dispatchEvent(new CustomEvent('unauthorized')); });
    act(() => { vi.advanceTimersByTime(2499); });

    expect(window.location.href).toBe('');
  });

  it('ignores subsequent events once redirect is scheduled', async () => {
    await renderComponent();

    act(() => {
      window.dispatchEvent(new CustomEvent('unauthorized'));
      window.dispatchEvent(new CustomEvent('forbidden'));
      window.dispatchEvent(new CustomEvent('unauthorized'));
    });

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('removes event listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = await renderComponent();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('unauthorized', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('forbidden', expect.any(Function));
  });

  it('clears the pending timeout on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = await renderComponent();

    act(() => { window.dispatchEvent(new CustomEvent('unauthorized')); });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
