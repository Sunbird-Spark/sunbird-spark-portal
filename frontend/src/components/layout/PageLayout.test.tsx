import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PageLayout from './PageLayout';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/components/home/Header', () => ({
  default: ({
    isSidebarOpen,
    onToggleSidebar,
  }: {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
  }) => (
    <header data-testid="header" data-sidebar-open={String(isSidebarOpen)}>
      <button onClick={onToggleSidebar} aria-label="Open sidebar">
        Open sidebar
      </button>
    </header>
  ),
}));

vi.mock('@/components/home/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock('@/components/home/HomeSidebar', () => ({
  default: ({
    activeNav,
    collapsed,
    onToggle,
    onNavChange,
  }: {
    activeNav: string;
    collapsed?: boolean;
    onToggle?: () => void;
    onNavChange: () => void;
  }) => (
    <div
      data-testid="sidebar"
      data-active-nav={activeNav}
      data-collapsed={String(!!collapsed)}
    >
      {onToggle && (
        <button onClick={onToggle} aria-label="Toggle collapse">
          Toggle collapse
        </button>
      )}
      <button onClick={onNavChange} aria-label="Navigate">
        Navigate
      </button>
    </div>
  ),
}));

vi.mock('@/components/home/Sheet', () => ({
  Sheet: ({
    open,
    children,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div data-testid="mobile-sheet">{children}</div> : null),
  SheetContent: ({
    children,
  }: {
    children: React.ReactNode;
    side?: string;
    className?: string;
  }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockUseIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Renders PageLayout inside a real router with a catch-all child route so
 * <Outlet /> has something to display.
 */
const renderLayout = (initialPath = '/home') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PageLayout />}>
          <Route
            path="*"
            element={<div data-testid="page-content">Page Content</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PageLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // default: desktop
  });

  // ── Core structure ─────────────────────────────────────────────────────────

  describe('core structure', () => {
    it('renders Header, Sidebar, Footer, and Outlet content', () => {
      renderLayout();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });
  });

  // ── Desktop sidebar ────────────────────────────────────────────────────────

  describe('desktop sidebar', () => {
    it('renders HomeSidebar (not Sheet) on desktop', () => {
      renderLayout();

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument();
    });

    it('sidebar is expanded by default on desktop', () => {
      renderLayout();

      expect(screen.getByTestId('sidebar')).toHaveAttribute(
        'data-collapsed',
        'false'
      );
    });

    it('collapses the sidebar when onToggle is called', () => {
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Toggle collapse' }));

      expect(screen.getByTestId('sidebar')).toHaveAttribute(
        'data-collapsed',
        'true'
      );
    });

    it('expands the sidebar again after a second toggle', () => {
      renderLayout();

      const toggleBtn = screen.getByRole('button', { name: 'Toggle collapse' });
      fireEvent.click(toggleBtn); // collapse
      fireEvent.click(toggleBtn); // expand

      expect(screen.getByTestId('sidebar')).toHaveAttribute(
        'data-collapsed',
        'false'
      );
    });

    it('passes isSidebarOpen=true to Header when sidebar is open', () => {
      renderLayout();

      expect(screen.getByTestId('header')).toHaveAttribute(
        'data-sidebar-open',
        'true'
      );
    });

    it('passes isSidebarOpen=false to Header after sidebar is collapsed', () => {
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Toggle collapse' }));

      expect(screen.getByTestId('header')).toHaveAttribute(
        'data-sidebar-open',
        'false'
      );
    });

    it('re-opens the sidebar when Header onToggleSidebar is called', () => {
      renderLayout();

      // Collapse first
      fireEvent.click(screen.getByRole('button', { name: 'Toggle collapse' }));
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true');

      // Re-open via Header button
      fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    });

    it('desktop onNavChange does not close the sidebar', () => {
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));

      // Sidebar should still be open (desktop nav change is a no-op)
      expect(screen.getByTestId('sidebar')).toHaveAttribute(
        'data-collapsed',
        'false'
      );
    });
  });

  // ── Mobile sidebar ─────────────────────────────────────────────────────────

  describe('mobile sidebar', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('renders Sheet instead of inline sidebar on mobile', () => {
      renderLayout();

      // Sheet is closed by default, so sidebar inside it is not visible
      expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('Sheet is closed by default on mobile', () => {
      renderLayout();

      expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument();
    });

    it('opens the Sheet when Header onToggleSidebar is called', () => {
      renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));

      expect(screen.getByTestId('mobile-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('closes the Sheet when mobile onNavChange is called', () => {
      renderLayout();

      // Open first
      fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));
      expect(screen.getByTestId('mobile-sheet')).toBeInTheDocument();

      // Navigating inside the sidebar should close the sheet
      fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
      expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument();
    });
  });

  // ── Viewport change sync ───────────────────────────────────────────────────

  describe('viewport change sync', () => {
    it('closes the sidebar when switching from desktop to mobile', () => {
      // Start on desktop (sidebar open)
      mockUseIsMobile.mockReturnValue(false);
      const { rerender } = renderLayout();
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');

      // Simulate viewport resize to mobile
      mockUseIsMobile.mockReturnValue(true);
      act(() => {
        rerender(
          <MemoryRouter initialEntries={['/home']}>
            <Routes>
              <Route element={<PageLayout />}>
                <Route path="*" element={<div data-testid="page-content">Page Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      // Sheet should be closed (isSidebarOpen reset to false for mobile)
      expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument();
    });

    it('opens the sidebar when switching from mobile to desktop', () => {
      // Start on mobile (sidebar closed)
      mockUseIsMobile.mockReturnValue(true);
      const { rerender } = renderLayout();
      expect(screen.queryByTestId('mobile-sheet')).not.toBeInTheDocument();

      // Simulate viewport resize to desktop
      mockUseIsMobile.mockReturnValue(false);
      act(() => {
        rerender(
          <MemoryRouter initialEntries={['/home']}>
            <Routes>
              <Route element={<PageLayout />}>
                <Route path="*" element={<div data-testid="page-content">Page Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        );
      });

      // Desktop sidebar should now be expanded
      expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    });
  });

  // ── Active nav derivation ──────────────────────────────────────────────────

  describe('active nav derivation', () => {
    const cases: [string, string][] = [
      ['/home', 'home'],
      ['/explore', 'explore'],
      ['/my-learning', 'learning'],
      ['/my-learning/some/sub/path', 'learning'],
      ['/workspace', 'workspace'],
      ['/profile', 'profile'],
      ['/help-support', 'help'],
      ['/help-support/login', 'help'],
      ['/user-management', 'user-management'],
      ['/reports/platform', 'admin-reports'],
      ['/reports', 'admin-reports'],
    ];

    it.each(cases)(
      'sets activeNav="%s" for path "%s"',
      (path, expectedNav) => {
        renderLayout(path);

        expect(screen.getByTestId('sidebar')).toHaveAttribute(
          'data-active-nav',
          expectedNav
        );
      }
    );

    it('gives /reports/user priority over /reports', () => {
      renderLayout('/reports/user/me');

      expect(screen.getByTestId('sidebar')).toHaveAttribute(
        'data-active-nav',
        'user-report'
      );
    });

    it('defaults activeNav to "home" for an unknown path', () => {
      renderLayout('/some-unknown-path');

      expect(screen.getByTestId('sidebar')).toHaveAttribute(
        'data-active-nav',
        'home'
      );
    });
  });
});
