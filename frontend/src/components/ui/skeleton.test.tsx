import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('has animate-pulse class by default', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
  });

  it('applies custom className', () => {
    render(<Skeleton className="h-5 w-20" data-testid="skeleton" />);
    const el = screen.getByTestId('skeleton');
    expect(el).toHaveClass('h-5');
    expect(el).toHaveClass('w-20');
  });

  it('passes through additional props', () => {
    render(<Skeleton aria-label="loading" data-testid="skeleton" />);
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('renders multiple skeletons independently', () => {
    render(
      <div>
        <Skeleton data-testid="sk1" className="h-4" />
        <Skeleton data-testid="sk2" className="h-8" />
      </div>
    );
    expect(screen.getByTestId('sk1')).toHaveClass('h-4');
    expect(screen.getByTestId('sk2')).toHaveClass('h-8');
  });
});
