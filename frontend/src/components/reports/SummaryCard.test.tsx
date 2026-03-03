import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryCard from './SummaryCard';

describe('SummaryCard', () => {
  it('renders label and value', () => {
    render(<SummaryCard label="Total Enrolled" value={120} />);
    expect(screen.getByText('Total Enrolled')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<SummaryCard label="Avg Score" value="85%" />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('applies colorClass', () => {
    const { container } = render(<SummaryCard label="Label" value={0} colorClass="bg-sunbird-ink" />);
    expect(container.firstChild).toHaveClass('bg-sunbird-ink');
  });

  it('renders skeleton when loading', () => {
    const { container } = render(<SummaryCard label="Label" value={0} loading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render value when loading', () => {
    render(<SummaryCard label="Label" value={42} loading />);
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<SummaryCard label="Label" value={1} icon={<span data-testid="icon">★</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('does not render icon wrapper when icon is absent', () => {
    const { container } = render(<SummaryCard label="Label" value={1} />);
    expect(container.querySelector('.bg-white\\/20')).not.toBeInTheDocument();
  });

  it('uses default colorClass if not provided', () => {
    const { container } = render(<SummaryCard label="Label" value={1} />);
    expect(container.firstChild).toHaveClass('bg-primary');
  });
});
