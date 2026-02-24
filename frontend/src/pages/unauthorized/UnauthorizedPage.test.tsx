import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnauthorizedPage from './UnauthorizedPage';
import * as PermissionHook from '../../hooks/usePermission';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/usePermission', () => ({
  usePermissions: vi.fn(() => ({
    primaryRole: 'GUEST',
    roles: ['GUEST'],
    isAuthenticated: false,
    isLoading: false,
    error: null,
    hasRole: vi.fn(),
    hasAnyRole: vi.fn(),
    hasAllRoles: vi.fn(),
    canAccessRoute: vi.fn(),
    canAccessFeature: vi.fn(),
    getDefaultRoute: vi.fn(),
    refetch: vi.fn(),
  })),
}));

describe('UnauthorizedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 403 error message', () => {
    render(
      <MemoryRouter>
        <UnauthorizedPage />
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
        <UnauthorizedPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Change Role')).toBeInTheDocument();
  });

  it('should navigate to login when Change Role button is clicked', () => {
    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );

    const changeRoleButton = screen.getByText('Change Role');
    fireEvent.click(changeRoleButton);

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should navigate to home when Go Home is clicked for guest user', () => {
    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );

    const goHomeButton = screen.getByText('Go Home');
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should navigate to /reports for admin user', () => {
    vi.spyOn(PermissionHook, 'usePermissions').mockReturnValue({
      primaryRole: 'ADMIN',
      roles: ['ADMIN'],
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
      canAccessRoute: vi.fn(),
      canAccessFeature: vi.fn(),
      getDefaultRoute: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Go Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/reports');
  });

  it('should navigate to /workspace for content_creator user', () => {
    vi.spyOn(PermissionHook, 'usePermissions').mockReturnValue({
      primaryRole: 'CONTENT_CREATOR',
      roles: ['CONTENT_CREATOR'],
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
      canAccessRoute: vi.fn(),
      canAccessFeature: vi.fn(),
      getDefaultRoute: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Go Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });

  it('should navigate to /workspace for content_reviewer user', () => {
    vi.spyOn(PermissionHook, 'usePermissions').mockReturnValue({
      primaryRole: 'CONTENT_REVIEWER',
      roles: ['CONTENT_REVIEWER'],
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
      canAccessRoute: vi.fn(),
      canAccessFeature: vi.fn(),
      getDefaultRoute: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Go Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });

  it('should navigate to /home for guest user', () => {
    vi.spyOn(PermissionHook, 'usePermissions').mockReturnValue({
      primaryRole: 'GUEST',
      roles: ['GUEST'],
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
      canAccessRoute: vi.fn(),
      canAccessFeature: vi.fn(),
      getDefaultRoute: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Go Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });
});
