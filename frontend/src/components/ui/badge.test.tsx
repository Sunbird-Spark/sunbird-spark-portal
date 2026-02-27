import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test Label</Badge>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with default variant by default', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const el = screen.getByTestId('badge');
    expect(el).toBeInTheDocument();
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    const el = screen.getByTestId('badge');
    expect(el).toHaveClass('bg-secondary');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive" data-testid="badge">Error</Badge>);
    const el = screen.getByTestId('badge');
    expect(el).toHaveClass('bg-destructive');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    const el = screen.getByTestId('badge');
    expect(el).toHaveClass('text-foreground');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Label</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    render(<Badge aria-label="status badge">Status</Badge>);
    expect(screen.getByLabelText('status badge')).toBeInTheDocument();
  });
});
