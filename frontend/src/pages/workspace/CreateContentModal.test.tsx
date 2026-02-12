import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateContentModal from './CreateContentModal';

vi.mock('@/components/common/Button', () => ({
  Button: ({ children, onClick, ...props }: React.ComponentProps<'button'>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/workspace/CreateOptions', () => ({
  default: ({ onOptionSelect }: { onOptionSelect: (id: string) => void }) => (
    <div data-testid="create-options">
      <button type="button" onClick={() => onOptionSelect('course')}>
        Select Course
      </button>
    </div>
  ),
}));

describe('CreateContentModal', () => {
  it('returns null when open is false', () => {
    const { container } = render(
      <CreateContentModal open={false} onClose={vi.fn()} onOptionSelect={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with title and close button when open', () => {
    render(
      <CreateContentModal open onClose={vi.fn()} onOptionSelect={vi.fn()} />
    );
    expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create Content' })).toBeInTheDocument();
    expect(screen.getByTestId('create-options')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <CreateContentModal open onClose={onClose} onOptionSelect={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <CreateContentModal open onClose={onClose} onOptionSelect={vi.fn()} />
    );
    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onOptionSelect when an option is selected and does not close on content click', () => {
    const onOptionSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <CreateContentModal open onClose={onClose} onOptionSelect={onOptionSelect} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Course' }));
    expect(onOptionSelect).toHaveBeenCalledWith('course');
    expect(onClose).not.toHaveBeenCalled();
  });
});
