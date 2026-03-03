import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TabBar, ActiveTab } from './BatchTabBar';

describe('BatchTabBar', () => {
  const defaultCounts: Record<ActiveTab, number> = {
    Ongoing: 0,
    Upcoming: 0,
    Expired: 0,
  };

  it('renders all three tabs (Ongoing, Upcoming, Expired)', () => {
    const onChangeMock = vi.fn();
    render(<TabBar activeTab="Ongoing" counts={defaultCounts} onChange={onChangeMock} />);
    
    expect(screen.getByRole('button', { name: /Ongoing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Expired/i })).toBeInTheDocument();
  });

  it('shows generic count bubble if count is greater than 0', () => {
    const counts = { Ongoing: 2, Upcoming: 5, Expired: 1 };
    render(<TabBar activeTab="Ongoing" counts={counts} onChange={vi.fn()} />);

    // Check numbers are rendered
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('hides count bubble if count is 0', () => {
    const counts = { Ongoing: 0, Upcoming: 0, Expired: 0 };
    render(<TabBar activeTab="Ongoing" counts={counts} onChange={vi.fn()} />);
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onChange with correct tab name when clicked', () => {
    const onChangeMock = vi.fn();
    render(<TabBar activeTab="Ongoing" counts={defaultCounts} onChange={onChangeMock} />);

    fireEvent.click(screen.getByRole('button', { name: /Upcoming/i }));
    expect(onChangeMock).toHaveBeenCalledWith('Upcoming');

    fireEvent.click(screen.getByRole('button', { name: /Expired/i }));
    expect(onChangeMock).toHaveBeenCalledWith('Expired');
  });

  it('applies active styling to the selected tab', () => {
    render(<TabBar activeTab="Upcoming" counts={{ Ongoing: 0, Upcoming: 10, Expired: 0 }} onChange={vi.fn()} />);

    const upcomingBtn = screen.getByRole('button', { name: /Upcoming/i });
    expect(upcomingBtn.className).toMatch(/text-sunbird-brick/);
    
    // inactive tab
    const ongoingBtn = screen.getByRole('button', { name: /Ongoing/i });
    expect(ongoingBtn.className).toMatch(/text-muted-foreground/);
  });
});
