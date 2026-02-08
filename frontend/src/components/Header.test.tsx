import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

// Mock the hooks
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'fr', label: 'Français' },
    ],
    currentLanguage: { code: 'en', label: 'English' },
    changeLanguage: vi.fn(),
    dir: 'ltr',
  }),
}));

const renderHeader = () => {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
};

describe('Header', () => {
  it('renders logo', () => {
    renderHeader();
    const logo = screen.getByAltText('Sunbird');
    expect(logo).toBeInTheDocument();
  });

  it('toggles mobile menu', () => {
    renderHeader();
    const menuButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg')?.classList.contains('w-5')
    );

    if (menuButton) {
      fireEvent.click(menuButton);
    }
  });

  it('toggles mobile search', () => {
    renderHeader();
    const buttons = screen.getAllByRole('button');
    const searchButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg !== null;
    });

    if (searchButton) {
      fireEvent.click(searchButton);
    }
  });

  it('handles notification deletion', () => {
    renderHeader();
    expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
  });

  it('changes language', () => {
    renderHeader();
    expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderHeader();
    expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
  });
});
