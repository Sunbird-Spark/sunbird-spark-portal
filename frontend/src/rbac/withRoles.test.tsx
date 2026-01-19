import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { withRoles } from './withRoles';
import { AuthProvider } from '../auth/AuthContext';
import { ReactNode } from 'react';
import * as AuthContext from '../auth/AuthContext';

// Mock components
const TestComponent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;
const CustomUnauthorized = () => <div>Custom Unauthorized</div>;

describe('withRoles HOC', () => {
  it('should redirect to login when user is not authenticated', () => {
    const ProtectedComponent = withRoles(['admin'])(TestComponent);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should redirect to login when user has incorrect role', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'guest' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const ProtectedComponent = withRoles(['admin'])(TestComponent);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    mockUseAuth.mockRestore();
  });

  it('should render component when user has correct role', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'admin' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const ProtectedComponent = withRoles(['admin'])(TestComponent);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    mockUseAuth.mockRestore();
  });

  it('should accept multiple allowed roles', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'content_reviewer' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const ProtectedComponent = withRoles(['content_creator', 'content_reviewer'])(TestComponent);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    mockUseAuth.mockRestore();
  });

  it('should use custom unauthenticatedTo path when provided', () => {
    const CustomLogin = () => <div>Custom Login</div>;
    const ProtectedComponent = withRoles(['admin'], { unauthenticatedTo: '/custom-login' })(
      TestComponent
    );

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/custom-login" element={<CustomLogin />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Login')).toBeInTheDocument();
  });

  it('should use custom redirectTo path when user has wrong role', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'guest' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const ProtectedComponent = withRoles(['admin'], { redirectTo: '/custom-unauthorized' })(
      TestComponent
    );

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/custom-unauthorized" element={<CustomUnauthorized />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Unauthorized')).toBeInTheDocument();
    mockUseAuth.mockRestore();
  });

  it('should preserve location state for return path', () => {
    const ProtectedComponent = withRoles(['admin'])(TestComponent);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/protected', state: { test: 'data' } }]}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should set correct display name for wrapped component', () => {
    const NamedComponent = () => <div>Test</div>;
    NamedComponent.displayName = 'NamedComponent';

    const ProtectedComponent = withRoles(['admin'])(NamedComponent);

    expect(ProtectedComponent.displayName).toBe('withRoles(NamedComponent)');
  });

  it('should handle component without display name', () => {
    const AnonymousComponent = () => <div>Test</div>;

    const ProtectedComponent = withRoles(['admin'])(AnonymousComponent);

    expect(ProtectedComponent.displayName).toContain('withRoles');
  });

  it('should allow first role in array', () => {
    const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'content_creator' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const ProtectedComponent = withRoles(['content_creator', 'content_reviewer'])(TestComponent);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    mockUseAuth.mockRestore();
  });

  it('should default to /login for unauthenticated when no custom path provided', () => {
    const ProtectedComponent = withRoles(['admin'])(TestComponent);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/protected" element={<ProtectedComponent />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
