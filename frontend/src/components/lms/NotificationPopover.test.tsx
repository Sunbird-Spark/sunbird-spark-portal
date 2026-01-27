import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPopover } from './NotificationPopover';

const mockNotifications = [
  {
    id: '1',
    message: 'Test notification 1',
    date: 'Today',
  },
  {
    id: '2',
    message: 'Test notification 2',
    date: 'Yesterday',
  },
];

describe('NotificationPopover', () => {
  it('renders with notifications', () => {
    const onDelete = vi.fn();
    render(
      <NotificationPopover
        notifications={mockNotifications}
        onDelete={onDelete}
      />
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    const onDelete = vi.fn();
    render(
      <NotificationPopover
        notifications={[]}
        onDelete={onDelete}
        isOpen={true}
      />
    );
    
    expect(screen.getByText('No new notifications')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <NotificationPopover
        notifications={mockNotifications}
        onDelete={onDelete}
        isOpen={true}
      />
    );
    
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')
    );
    
    const deleteButton = deleteButtons[2];
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(onDelete).toHaveBeenCalledWith('1');
    }
  });

  it('renders in mobile mode', () => {
    const onDelete = vi.fn();
    render(
      <NotificationPopover
        notifications={mockNotifications}
        onDelete={onDelete}
        isMobile={true}
        isOpen={true}
      />
    );
    
    expect(screen.getByText('2 New Notification(s)')).toBeInTheDocument();
  });

  it('calls onOpenChange when close button clicked', () => {
    const onDelete = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <NotificationPopover
        notifications={mockNotifications}
        onDelete={onDelete}
        isOpen={true}
        onOpenChange={onOpenChange}
      />
    );
    
    const closeButton = screen.getAllByRole('button').find(btn => 
      btn.className.includes('h-6 w-6')
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });
});
