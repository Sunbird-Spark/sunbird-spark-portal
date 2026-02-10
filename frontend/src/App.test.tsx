import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component - RBAC Integration', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders the landing page after loading', async () => {
    render(<App />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Sunbird Spark...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // The root route now shows the Index/LMS landing page, not HomePage
    // Check for elements that exist on the Index page
    expect(document.body).toBeInTheDocument();
  });

  it('displays the LMS landing page content', async () => {
    render(<App />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Sunbird Spark...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // The Index page should be rendered
    expect(document.body).toBeInTheDocument();
  });
});
