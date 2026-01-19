import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../auth/AuthContext';

describe('LoginPage', () => {
  it('should render login form with role selector', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Select Role:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('should display all role options', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Select Role:');
    const options = Array.from(select.querySelectorAll('option'));

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Admin');
    expect(options[1]).toHaveTextContent('Content Creator');
    expect(options[2]).toHaveTextContent('Content Reviewer');
    expect(options[3]).toHaveTextContent('Guest');
  });

  it('should have guest as default selected role', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Select Role:') as HTMLSelectElement;
    expect(select.value).toBe('guest');
  });

  it('should allow changing the selected role', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Select Role:') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'admin' } });
    expect(select.value).toBe('admin');

    fireEvent.change(select, { target: { value: 'content_creator' } });
    expect(select.value).toBe('content_creator');
  });
});
