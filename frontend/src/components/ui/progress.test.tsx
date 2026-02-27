import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders without crashing', () => {
    render(<Progress data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('applies value to transform style', () => {
    const { container } = render(<Progress value={50} />);
    const bar = container.querySelector('.bg-primary');
    expect(bar).toHaveStyle({ transform: 'translateX(-50%)' });
  });

  it('clamps value at 0 (negative input)', () => {
    const { container } = render(<Progress value={-10} />);
    const bar = container.querySelector('.bg-primary');
    expect(bar).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('clamps value at 100 (overflow input)', () => {
    const { container } = render(<Progress value={150} />);
    const bar = container.querySelector('.bg-primary');
    expect(bar).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('defaults to 0 when no value provided', () => {
    const { container } = render(<Progress />);
    const bar = container.querySelector('.bg-primary');
    expect(bar).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('applies custom className', () => {
    render(<Progress className="my-progress" data-testid="progress" />);
    expect(screen.getByTestId('progress')).toHaveClass('my-progress');
  });

  it('renders full bar at value 100', () => {
    const { container } = render(<Progress value={100} />);
    const bar = container.querySelector('.bg-primary');
    expect(bar).toHaveStyle({ transform: 'translateX(-0%)' });
  });
});
