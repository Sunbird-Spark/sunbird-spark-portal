import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteRoleDialog, DeleteDialogState } from './DeleteRoleDialog';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (k: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'cancel': 'cancel',
        'confirm': 'Confirm',
        'confirmDialog.pleaseWait': 'confirmDialog.pleaseWait',
        'userManagement.deleteRoleDialog.title': 'Remove Role',
        'userManagement.deleteRoleDialog.confirmDesc': 'Are you sure you want to remove the role "{{role}}"?',
        'userManagement.deleteRoleDialog.confirmDescFallback': 'Are you sure you want to remove this role?',
        'userManagement.deleteRoleDialog.remove': 'Remove',
      };
      let str = map[k] ?? k;
      if (opts) {
        for (const [key, v] of Object.entries(opts)) {
          str = str.replace(`{{${key}}}`, String(v));
        }
      }
      return str;
    },
    languages: [],
    currentCode: 'en',
    currentLanguage: { code: 'en', label: 'English', dir: 'ltr', index: 1, font: "'Rubik', sans-serif" },
    changeLanguage: vi.fn(),
    isRTL: false,
    dir: 'ltr',
  }),
}));

const mockStateOpen: DeleteDialogState = {
  open: true,
  userId: 'user1',
  roleInfo: {
    role: 'CONTENT_CREATOR',
    scope: [{ organisationId: 'org1' }],
    createdDate: '',
    updatedDate: null,
    userId: 'user1',
  },
};

const mockStateOpenNoRole: DeleteDialogState = {
  open: true,
  userId: 'user1',
  roleInfo: null,
};

describe('DeleteRoleDialog', () => {
  it('does not render when open is false', () => {
    const { container } = render(
      <DeleteRoleDialog
        dialogState={{ ...mockStateOpen, open: false }}
        isDeletingRole={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders specific role name in description when roleInfo is provided', () => {
    render(
      <DeleteRoleDialog
        dialogState={mockStateOpen}
        isDeletingRole={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(
      screen.getByText(/Are you sure you want to remove the role "CONTENT_CREATOR"\?/)
    ).toBeInTheDocument();
  });

  it('renders generic description when roleInfo is null', () => {
    render(
      <DeleteRoleDialog
        dialogState={mockStateOpenNoRole}
        isDeletingRole={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Are you sure you want to remove this role?')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <DeleteRoleDialog
        dialogState={mockStateOpen}
        isDeletingRole={false}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Remove is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteRoleDialog
        dialogState={mockStateOpen}
        isDeletingRole={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isDeletingRole is true', () => {
    render(
      <DeleteRoleDialog
        dialogState={mockStateOpen}
        isDeletingRole={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'confirmDialog.pleaseWait' })).toBeDisabled();
  });
});
