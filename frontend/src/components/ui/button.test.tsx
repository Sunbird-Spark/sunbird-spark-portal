import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with default variant', () => {
    render(<Button data-testid="btn">Default</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('bg-primary');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline" data-testid="btn">Outline</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('border');
  });

  it('renders with destructive variant', () => {
    render(<Button variant="destructive" data-testid="btn">Delete</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('bg-destructive');
  });

  it('renders with ghost variant', () => {
    render(<Button variant="ghost" data-testid="btn">Ghost</Button>);
    expect(screen.getByTestId('btn')).not.toHaveClass('bg-primary');
  });

  it('renders with sm size', () => {
    render(<Button size="sm" data-testid="btn">Small</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('h-8');
  });

  it('renders with lg size', () => {
    render(<Button size="lg" data-testid="btn">Large</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('h-10');
  });

  it('renders with icon size', () => {
    render(<Button size="icon" data-testid="btn">X</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('h-9', 'w-9');
  });

  it('applies custom className', () => {
    render(<Button className="custom-cls" data-testid="btn">Custom</Button>);
    expect(screen.getByTestId('btn')).toHaveClass('custom-cls');
  });

  it('renders as child element with asChild', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument();
  });
});
