import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartCard from './ChartCard';

describe('ChartCard', () => {
  it('renders title', () => {
    render(<ChartCard title="Enrollment vs Completion"><div>chart</div></ChartCard>);
    expect(screen.getByText('Enrollment vs Completion')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<ChartCard title="Chart"><div data-testid="chart-child">content</div></ChartCard>);
    expect(screen.getByTestId('chart-child')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <ChartCard title="Chart" actions={<button>Filter</button>}>
        <div>content</div>
      </ChartCard>
    );
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(<ChartCard title="Chart" loading><div>content</div></ChartCard>);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render children when loading', () => {
    render(<ChartCard title="Chart" loading><div data-testid="chart-child">content</div></ChartCard>);
    expect(screen.queryByTestId('chart-child')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChartCard title="Chart" className="xl:col-span-2"><div>content</div></ChartCard>
    );
    expect(container.firstChild).toHaveClass('xl:col-span-2');
  });

  it('renders with default empty className', () => {
    const { container } = render(<ChartCard title="Chart"><div>content</div></ChartCard>);
    expect(container.firstChild).toBeInTheDocument();
  });
});
