import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component - RBAC Integration', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders the home page with courses and login form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Welcome to Sunbird Portal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Available Courses' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Select Role:')).toBeInTheDocument();
  });

  it('displays course list and login button', () => {
    render(<App />);
    
    expect(screen.getByText('Course 1')).toBeInTheDocument();
    expect(screen.getByText('Course 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
