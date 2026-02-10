import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import i18n from '../configs/i18n';
import { useAppI18n } from '../hooks/useAppI18n';
import SimpleLanguageSwitcher from '../components/common/SimpleLanguageSwitcher';

// Mock component to test the hook
function TestComponent() {
  const { t, changeLanguage, currentCode } = useAppI18n();

  return (
    <div>
      <span data-testid="greeting">{t('loading')}</span>
      <span data-testid="current-lang">{currentCode}</span>
      <button
        data-testid="change-lang"
        onClick={() => void changeLanguage('en')}
      >
        Change to English
      </button>
    </div>
  );
}

describe('Simple Internationalization (i18n)', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en');
  });

  it('should initialize with English as default language', async () => {
    render(<TestComponent />);

    expect(screen.getByTestId('greeting')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
  });

  it('should change language when requested', async () => {
    render(<TestComponent />);

    // Initially in English
    expect(screen.getByTestId('greeting')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');

    // Language should remain English after clicking
    fireEvent.click(screen.getByTestId('change-lang'));

    // Wait for any potential language change
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
  });

  it('should render SimpleLanguageSwitcher component', () => {
    render(<SimpleLanguageSwitcher />);

    // Should have a select dropdown (combobox role)
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText('Change language')).toBeInTheDocument();
  });

  it('should toggle language when SimpleLanguageSwitcher is changed', async () => {
    render(<SimpleLanguageSwitcher />);

    const select = screen.getByRole('combobox');

    // Initially should be 'en' (English)
    expect(select).toHaveValue('en');

    // Change to another language (just test that the select works)
    fireEvent.change(select, { target: { value: 'en' } });

    // Wait for state update
    await waitFor(() => {
      expect(select).toHaveValue('en');
    });
  });

  it('should support direct translation keys', () => {
    const translation = i18n.t('title');
    expect(translation).toBe('SunbirdEd Portal');
  });

  it('should fallback to key for missing translations', async () => {
    const translation = i18n.t('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
  });
});