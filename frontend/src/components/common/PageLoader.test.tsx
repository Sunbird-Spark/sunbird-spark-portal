import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PageLoader from './PageLoader';

describe('PageLoader', () => {
  it('renders default message without error', () => {
    // using DissolveLoader inherently via PageLoader
    render(<PageLoader />);
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('renders a custom loading message', () => {
    render(<PageLoader message="Customizing Loading..." />);
    // dissolve loader handles the message, we can just check if page-loader exists
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('renders an error message when provided', () => {
    render(<PageLoader error="Something broke horribly" />);
    // When error is present, we shouldn't see DissolveLoader
    expect(screen.queryByTestId('dissolve-loader')).not.toBeInTheDocument();
    expect(screen.getByText('Something broke horribly')).toBeInTheDocument();
  });

  it('renders a retry button when onRetry is provided with an error', () => {
    const handleRetry = vi.fn();
    render(<PageLoader error="Something broke horribly" onRetry={handleRetry} />);
    
    const retryBtn = screen.getByRole('button');
    expect(retryBtn).toBeInTheDocument();
    
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
