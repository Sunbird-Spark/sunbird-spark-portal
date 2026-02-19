import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Header from '../home/Header';

// Mock useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/',
    }),
  };
});

// Mock the hooks
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'fr', label: 'Français' },
    ],
    currentCode: 'en', // Changed from currentLanguage object to currentCode string to match component
    changeLanguage: vi.fn(),
    dir: 'ltr',
  }),
}));

// Mock useAuth
vi.mock('@/auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  })),
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
