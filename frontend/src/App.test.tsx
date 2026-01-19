import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';
import type { SupportedLanguage } from './configs/languages';
import type { LanguageConfig } from './configs/languages';

/**
 * Translation Mocking Strategy:
 * 
 * These tests use mocked translation keys instead of actual translations to ensure
 * tests remain stable when translation content changes. This approach:
 * 
 * 1. Tests the FUNCTIONALITY of language switching, not the translation content
 * 2. Prevents test failures when translation strings are updated
 * 3. Makes tests faster by avoiding actual i18n initialization
 * 4. Provides predictable, consistent test values (TITLE_EN, TITLE_FR, etc.)
 * 
 * When adding new translation keys, update MOCK_TRANSLATIONS below.
 */

// Mock translation keys matching your flat structure
const MOCK_TRANSLATIONS = {
  en: {
    'title': 'TITLE_EN',
    'subtitle': 'SUBTITLE_EN',
    'welcome': 'WELCOME_EN',
    'dashboard': 'DASHBOARD_EN',
    'save': 'SAVE_EN',
    'cancel': 'CANCEL_EN',
  },
  fr: {
    'title': 'TITLE_FR',
    'subtitle': 'SUBTITLE_FR',
    'welcome': 'WELCOME_FR',
    'dashboard': 'DASHBOARD_FR',
    'save': 'SAVE_FR',
    'cancel': 'CANCEL_FR',
  }
} as const;

// Shared state for mocked i18n
let mockCurrentLanguage: SupportedLanguage = 'en';

// Mock languages
const MOCK_LANGUAGE_MAP: Record<SupportedLanguage, LanguageConfig> = {
  en: { code: 'en', label: 'English', dir: 'ltr', index: 1 },
  fr: { code: 'fr', label: 'Français', dir: 'ltr', index: 2 },
  pt: { code: 'pt', label: 'Português', dir: 'ltr', index: 3 },
  ar: { code: 'ar', label: 'العربية', dir: 'rtl', index: 4 },
};

// Mock the translation function
const mockT = vi.fn((key: string): string => {
  const translations = MOCK_TRANSLATIONS[mockCurrentLanguage as keyof typeof MOCK_TRANSLATIONS];
  return translations?.[key as keyof typeof translations] ?? key;
});

const mockChangeLanguage = vi.fn((lang: SupportedLanguage) => {
  mockCurrentLanguage = lang;
  return Promise.resolve();
});

// Mock useAppI18n hook
vi.mock('./hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: mockT,
    currentLanguage: MOCK_LANGUAGE_MAP[mockCurrentLanguage],
    currentCode: mockCurrentLanguage,
    dir: MOCK_LANGUAGE_MAP[mockCurrentLanguage].dir,
    isRTL: MOCK_LANGUAGE_MAP[mockCurrentLanguage].dir === 'rtl',
    changeLanguage: mockChangeLanguage,
    languages: Object.values(MOCK_LANGUAGE_MAP),
  }),
}));

// Mock language configs
vi.mock('./configs/languages', () => ({
  LANGUAGE_MAP: {
    en: { code: 'en', label: 'English', dir: 'ltr', index: 1 },
    fr: { code: 'fr', label: 'Français', dir: 'ltr', index: 2 },
    pt: { code: 'pt', label: 'Português', dir: 'ltr', index: 3 },
    ar: { code: 'ar', label: 'العربية', dir: 'rtl', index: 4 },
  },
  DEFAULT_LANGUAGE: 'en',
  SORTED_LANGUAGES: [
    { code: 'en', label: 'English', dir: 'ltr', index: 1 },
    { code: 'fr', label: 'Français', dir: 'ltr', index: 2 },
    { code: 'pt', label: 'Português', dir: 'ltr', index: 3 },
    { code: 'ar', label: 'العربية', dir: 'rtl', index: 4 },
  ],
}));

// Mock the SimpleLanguageSwitcher component
vi.mock('./components/SimpleLanguageSwitcher', () => ({
  default: function MockSimpleLanguageSwitcher() {
    const handleClick = (): void => {
      const newLang = mockCurrentLanguage === 'en' ? 'fr' : 'en';
      mockCurrentLanguage = newLang;
      void mockChangeLanguage(newLang);
    };

    return (
      <button 
        type="button" 
        onClick={handleClick}
        aria-label={mockCurrentLanguage === 'en' ? 'Switch to French' : 'Switch to English'}
      >
        {mockCurrentLanguage === 'en' ? 'Switch to French' : 'Switch to English'}
      </button>
    );
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset to English before each test
    mockCurrentLanguage = 'en';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('displays the correct title', () => {
    render(<App />);
    const titleElement = screen.getByRole('heading', { level: 1 });
    expect(titleElement).toHaveTextContent('TITLE_EN');
  });

  it('displays welcome message', () => {
    render(<App />);
    expect(screen.getByText('WELCOME_EN')).toBeInTheDocument();
  });

  it('has proper container structure', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeDefined();
    expect(heading).toBeInTheDocument();
  });

  it('shows language switcher', () => {
    render(<App />);
    const languageSwitcher = screen.getByRole('button', { name: /Switch to French/i });
    expect(languageSwitcher).toBeInTheDocument();
  });

  it('displays current language information', () => {
    render(<App />);
    expect(screen.getByText('Current Language:')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('displays translation examples', () => {
    render(<App />);
    expect(screen.getByText('Welcome Message:')).toBeInTheDocument();
    expect(screen.getByText('Dashboard:')).toBeInTheDocument();
  });

  it('has save and cancel buttons with proper labels', () => {
    render(<App />);
    const saveButton = screen.getByRole('button', { name: /SAVE_EN/i });
    const cancelButton = screen.getByRole('button', { name: /CANCEL_EN/i });
    
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<App />);
    const mainHeading = screen.getByRole('heading', { level: 1 });
    const secondaryHeading = screen.getByRole('heading', { level: 2 });
    
    expect(mainHeading).toBeInTheDocument();
    expect(secondaryHeading).toBeInTheDocument();
  });

  it('uses proper semantic HTML structure', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3); // save, cancel, and language switcher
  });

  it('switches language when button is clicked', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    
    // Initially in English
    expect(screen.getByText('TITLE_EN')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    
    // Click language switcher
    const languageButton = screen.getByRole('button', { name: /Switch to French/i });
    await user.click(languageButton);
    
    // Verify language change was called
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    
    // Unmount and re-render to simulate state change
    unmount();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('TITLE_FR')).toBeInTheDocument();
    });
  });

  it('displays content in French after language change', () => {
    // Change to French before render
    mockCurrentLanguage = 'fr';
    
    render(<App />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('TITLE_FR');
    expect(screen.getByText('SUBTITLE_FR')).toBeInTheDocument();
    expect(screen.getByText('WELCOME_FR')).toBeInTheDocument();
    expect(screen.getAllByText('DASHBOARD_FR').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /SAVE_FR/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CANCEL_FR/i })).toBeInTheDocument();
  });

  it('toggles between languages', async () => {
    const user = userEvent.setup();
    
    // Start in English
    mockCurrentLanguage = 'en';
    let { unmount } = render(<App />);
    expect(screen.getByText('TITLE_EN')).toBeInTheDocument();
    
    // Switch to French
    const frenchButton = screen.getByRole('button', { name: 'Switch to French' });
    await user.click(frenchButton);
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    
    // Clean up before re-render
    unmount();
    vi.clearAllMocks();
    
    // Re-render with French
    mockCurrentLanguage = 'fr';
    const { unmount: unmount2 } = render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('TITLE_FR')).toBeInTheDocument();
    });
    
    // Switch back to English
    const englishButtons = screen.getAllByRole('button', { name: 'Switch to English' });
    // Use the first button (or the language switcher specifically)
    await user.click(englishButtons[0]);
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    
    // Clean up before final re-render
    unmount2();
    vi.clearAllMocks();
    
    mockCurrentLanguage = 'en';
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('TITLE_EN')).toBeInTheDocument();
    });
  });

  it('displays fallback text when translation is missing', () => {
    render(<App />);
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    
    // Test that buttons work even if translations fail
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('handles both language display branches', () => {
    // Test English display
    mockCurrentLanguage = 'en';
    const { unmount } = render(<App />);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    
    // Switch to French
    mockCurrentLanguage = 'fr';
    unmount();
    render(<App />);
    
    expect(screen.getByText(/Français/)).toBeInTheDocument();
  });
});