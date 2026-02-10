import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnauthorizedPage from './UnauthorizedPage';
import { AuthProvider } from '../../auth/AuthContext';
import * as AuthContext from '../../auth/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UnauthorizedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 403 error message', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have the required permissions to access this page.')
    ).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Change Role')).toBeInTheDocument();
  });

  it('should navigate to login when Change Role button is clicked', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const changeRoleButton = screen.getByText('Change Role');
    fireEvent.click(changeRoleButton);

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should navigate to home when Go Home is clicked for unauthenticated user', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should navigate to /reports for admin user', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Admin User', role: 'admin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/reports');
    mockUseAuth.mockRestore();
  });

  it('should navigate to /workspace for content_creator user', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Creator', role: 'content_creator' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
    mockUseAuth.mockRestore();
  });

  it('should navigate to /workspace for content_reviewer user', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Reviewer', role: 'content_reviewer' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
    mockUseAuth.mockRestore();
  });

  it('should navigate to /home for guest user', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Guest', role: 'guest' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <UnauthorizedPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/home');
    mockUseAuth.mockRestore();
  });
});
