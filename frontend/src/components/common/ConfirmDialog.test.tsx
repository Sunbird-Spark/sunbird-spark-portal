import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import ConfirmDialog from './ConfirmDialog';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'confirm': 'Confirm',
        'cancel': 'Cancel',
        'confirmDialog.pleaseWait': 'Please wait...',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ConfirmDialog', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const renderDialog = (props?: Partial<ComponentProps<typeof ConfirmDialog>>) =>
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Content"
        description="Are you sure?"
        {...props}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, description and default actions when open', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Delete Content' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    renderDialog({ confirmLabel: 'Delete' });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    renderDialog();

    fireEvent.click(screen.getByRole('dialog', { name: 'Delete Content' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when dialog panel itself is clicked', () => {
    renderDialog();

    fireEvent.click(screen.getByText('Are you sure?'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key when not loading', () => {
    renderDialog();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('prevents closing interactions while loading', () => {
    renderDialog({ isLoading: true });

    fireEvent.click(screen.getByRole('dialog', { name: 'Delete Content' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled();
  });
});
