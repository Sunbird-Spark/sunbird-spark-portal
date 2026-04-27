import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../home/Header';

// --------------------
// Mocks
// --------------------

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/', search: '' }),
  };
});

const mockChangeLanguage = vi.fn();

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'onboarding.altSunbird': 'Sunbird',
        'header.openMenu': 'Open menu',
        'header.closeMenu': 'Close menu',
        'header.search': 'Search',
        'changeLanguage': 'Language',
        'nav.home': 'Home',
        'nav.explore': 'Explore',
        'nav.about': 'About',
        'nav.contact': 'Contact',
      };
      return translations[key] || key;
    },
    languages: [
      { code: 'en', label: 'English' },
      { code: 'fr', label: 'Français' },
    ],
    currentCode: 'en',
    changeLanguage: mockChangeLanguage,
    dir: 'ltr',
    isRTL: false,
  }),
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermissions: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    roles: ['PUBLIC'],
    error: null,
    hasAnyRole: vi.fn(),
    canAccessFeature: vi.fn(),
    refetch: vi.fn(),
  })),
}));

// Mock AuthenticatedHeader so Header can import it without side effects
vi.mock('./AuthenticatedHeader', () => ({
  default: () => <div data-testid="authenticated-header">Authenticated Header</div>,
}));

// SearchModal mock — renders visibly only when isOpen=true so we can assert on it
vi.mock('@/components/common/SearchModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="search-modal">
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
}));

// --------------------
// Helper
// --------------------

const renderHeader = () =>
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );

// --------------------
// Tests
// --------------------

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('static rendering', () => {
    it('renders the Sunbird logo', () => {
      renderHeader();
      expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
    });

    it('logo links to / for anonymous users', () => {
      renderHeader();
      const logoLink = screen.getByAltText('Sunbird').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('renders the desktop navigation links', () => {
      renderHeader();
      // The t() mock now returns localized values
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Explore').length).toBeGreaterThan(0);
    });

    it('renders the login button', () => {
      renderHeader();
      expect(screen.getByText('login')).toBeInTheDocument();
    });
  });

  describe('mobile menu', () => {
    it('opens the mobile menu when the hamburger button is clicked', () => {
      renderHeader();
      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);
      // After opening, the aria-label changes and nav links appear in mobile panel
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    });

    it('closes the mobile menu when the close button is clicked', () => {
      renderHeader();
      fireEvent.click(screen.getByLabelText('Open menu'));
      fireEvent.click(screen.getByLabelText('Close menu'));
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });
  });

  describe('search modal — desktop', () => {
    it('does not show the search modal on initial render', () => {
      renderHeader();
      expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
    });

    it('opens the search modal when the desktop search icon button is clicked', () => {
      renderHeader();
      // The desktop search button is the one with aria-label-less FiSearch inside .hidden.md:flex section
      // It is the first button that contains an SVG and has the sunbird-brick class
      const allButtons = screen.getAllByRole('button');
      // Find the desktop search button by its class (p-2.5 text-sunbird-brick)
      const searchButton = allButtons.find(
        (btn) =>
          btn.className.includes('p-2.5') &&
          btn.className.includes('sunbird-brick') &&
          !btn.className.includes('md:hidden')
      );
      expect(searchButton).toBeDefined();
      fireEvent.click(searchButton!);
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });

    it('closes the search modal when the modal calls onClose', () => {
      renderHeader();
      const allButtons = screen.getAllByRole('button');
      const searchButton = allButtons.find(
        (btn) =>
          btn.className.includes('p-2.5') &&
          btn.className.includes('sunbird-brick') &&
          !btn.className.includes('md:hidden')
      );
      fireEvent.click(searchButton!);
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('close-modal'));
      expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
    });
  });

  describe('search modal — mobile', () => {
    it('opens the search modal from the mobile menu', () => {
      renderHeader();
      // Open mobile menu first
      fireEvent.click(screen.getByLabelText('Open menu'));
      // Click the mobile search button (shows the text label via t() key)
      fireEvent.click(screen.getByText('Search'));
      expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });

    it('closes the mobile menu when the mobile search button is clicked', () => {
      renderHeader();
      fireEvent.click(screen.getByLabelText('Open menu'));
      fireEvent.click(screen.getByText('Search'));
      // Mobile menu close button should no longer be visible (menu is closed)
      expect(screen.queryByLabelText('Close menu')).not.toBeInTheDocument();
    });
  });

  describe('language selector', () => {
    it('renders language options', () => {
      renderHeader();
      expect(screen.getByAltText('Language')).toBeInTheDocument();
    });
  });

  describe('mobile menu — nav link click closes menu (line 168)', () => {
    it('closes the mobile menu when a nav link is clicked', () => {
      renderHeader();
      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument();

      // Mobile nav links render inside the mobile menu panel.
      // There are two "Home" links (desktop + mobile); the mobile one closes the menu.
      const homeLinks = screen.getAllByText('Home');
      // Click the last one which is inside the mobile menu panel
      fireEvent.click(homeLinks[homeLinks.length - 1]!);
      expect(screen.queryByLabelText('Close menu')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });
  });

  describe('mobile language select — changeLanguage (line 195)', () => {
    it('calls changeLanguage when the mobile language select changes', () => {
      renderHeader();

      // Open mobile menu to reveal the language select
      fireEvent.click(screen.getByLabelText('Open menu'));

      const select = screen.getByDisplayValue('English') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'fr' } });
      expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    });
  });

  describe('mobile login button (lines 210-212)', () => {
    it('closes the mobile menu and redirects to login when mobile login button is clicked', () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

      renderHeader();
      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument();

      // There are two login buttons — desktop (hidden md) and mobile (visible in mobile panel)
      const loginButtons = screen.getAllByText('login');
      // The last one is inside the mobile menu
      fireEvent.click(loginButtons[loginButtons.length - 1]!);

      // Menu is now closed
      expect(screen.queryByLabelText('Close menu')).not.toBeInTheDocument();
      // Redirect happened (returnTo encodes the mocked pathname '/', which resolves to targetPath '/home')
      expect(window.location.href).toBe('/portal/login?prompt=none&returnTo=%2Fhome');
    });
  });
});
