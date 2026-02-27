import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { AuthProvider } from '../../auth/AuthContext';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

// Mock userAuthInfoService
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getAuthInfo: vi.fn(),
    clearAuth: vi.fn(),
  },
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    // Default mock implementation
    (userAuthInfoService.getAuthInfo as any).mockResolvedValue({
      isAuthenticated: false,
      uid: null,
      sid: 'test-session-id',
    });
  });
  it('should render welcome message and courses', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'welcome' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'coursesAvailable' })).toBeInTheDocument();
    expect(screen.getByText('homePageDemo.course1')).toBeInTheDocument();
    expect(screen.getByText('homePageDemo.course2')).toBeInTheDocument();
  });

  it('should render login form with role selector', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'login' })).toBeInTheDocument();
    expect(screen.getByLabelText('selectRole')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login' })).toBeInTheDocument();
  });

  it('should display all role options', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('selectRole');
    const options = Array.from(select.querySelectorAll('option'));

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('roles.admin');
    expect(options[1]).toHaveTextContent('roles.content_creator');
    expect(options[2]).toHaveTextContent('roles.content_reviewer');
    expect(options[3]).toHaveTextContent('roles.guest');
  });
});
