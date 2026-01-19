import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component - RBAC Integration', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders the login page by default for unauthenticated users', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Select Role:')).toBeInTheDocument();
  });

  it('renders all role options in the login form', () => {
    render(<App />);
    
    const select = screen.getByLabelText('Select Role:');
    const options = Array.from(select.querySelectorAll('option'));

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Admin');
    expect(options[1]).toHaveTextContent('Content Creator');
    expect(options[2]).toHaveTextContent('Content Reviewer');
    expect(options[3]).toHaveTextContent('Guest');
  });

  it('has a login button', () => {
    render(<App />);
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
  });
});
