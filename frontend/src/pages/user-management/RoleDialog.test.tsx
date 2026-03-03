import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleDialog, RoleDialogState } from './RoleDialog';
import { RoleItem } from '@/services/UserManagementService';

vi.mock('@/components/common/Select', () => ({
  Select: ({ children, onValueChange, disabled }: any) => (
    <div data-testid="mock-select" data-disabled={disabled}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child as any, { onValueChange, disabled }) : child
      )}
    </div>
  ),
  SelectTrigger: ({ children, disabled, 'data-testid': testId }: any) => (
    <button data-testid={testId} disabled={disabled}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children, onValueChange, disabled }: any) => (
    <div>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child as any, { onValueChange, disabled }) : child
      )}
    </div>
  ),
  SelectItem: ({ children, value, onValueChange }: any) => (
    <div onClick={() => onValueChange?.(value)} data-testid={`item-${value}`}>
      {children}
    </div>
  ),
}));

const MOCK_ROLES: RoleItem[] = [
  { id: 'ROLE_1', name: 'Role One', actionGroups: [] },
  { id: 'ROLE_2', name: 'Role Two', actionGroups: [] },
];

const mockStateAdd: RoleDialogState = {
  open: true,
  userId: 'user1',
  operation: 'add',
};

const mockStateUpdate: RoleDialogState = {
  open: true,
  userId: 'user1',
  operation: 'update',
};

describe('RoleDialog', () => {
  it('does not render when dialogState.open is false', () => {
    const { container } = render(
      <RoleDialog
        dialogState={{ ...mockStateAdd, open: false }}
        availableRoles={MOCK_ROLES}
        selectedRole=""
        organisationId=""
        isSavingRole={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={vi.fn()}
        userOrganisations={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders "Add New Role" title when operation is "add"', () => {
    render(
      <RoleDialog
        dialogState={mockStateAdd}
        availableRoles={MOCK_ROLES}
        selectedRole=""
        organisationId=""
        isSavingRole={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={vi.fn()}
        userOrganisations={[]}
      />
    );
    expect(screen.getByText('Add New Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('renders "Edit Role" title when operation is "update"', () => {
    render(
      <RoleDialog
        dialogState={mockStateUpdate}
        availableRoles={MOCK_ROLES}
        selectedRole=""
        organisationId=""
        isSavingRole={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={vi.fn()}
        userOrganisations={[]}
      />
    );
    expect(screen.getByText('Edit Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <RoleDialog
        dialogState={mockStateAdd}
        availableRoles={MOCK_ROLES}
        selectedRole=""
        organisationId=""
        isSavingRole={false}
        onClose={onClose}
        onSave={vi.fn()}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={vi.fn()}
        userOrganisations={[]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when Save/Add is clicked', () => {
    const onSave = vi.fn();
    const mockOrgs = [{ organisationId: 'org123', orgName: 'Test Org' }];
    render(
      <RoleDialog
        dialogState={mockStateAdd}
        availableRoles={MOCK_ROLES}
        selectedRole="ROLE_1"
        organisationId="org123"
        isSavingRole={false}
        onClose={vi.fn()}
        onSave={onSave}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={vi.fn()}
        userOrganisations={mockOrgs}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onOrganisationIdChange when Organisation Name is selected', () => {
    const onOrgChange = vi.fn();
    const mockOrgs = [{ organisationId: 'org123', orgName: 'Test Org' }];
    render(
      <RoleDialog
        dialogState={mockStateAdd}
        availableRoles={MOCK_ROLES}
        selectedRole=""
        organisationId=""
        isSavingRole={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={onOrgChange}
        userOrganisations={mockOrgs}
      />
    );
    fireEvent.click(screen.getByTestId('item-org123'));
    expect(onOrgChange).toHaveBeenCalledWith('org123');
  });

  it('disables buttons when isSavingRole is true', () => {
    render(
      <RoleDialog
        dialogState={mockStateAdd}
        availableRoles={MOCK_ROLES}
        selectedRole=""
        organisationId=""
        isSavingRole={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={vi.fn()}
        userOrganisations={[]}
      />
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    expect(screen.getByTestId('um-org-select')).toBeDisabled();
    expect(screen.getByTestId('um-role-select')).toBeDisabled();
  });

  it('disables Save button when userOrganisations is empty', () => {
    render(
      <RoleDialog
        dialogState={mockStateAdd}
        availableRoles={MOCK_ROLES}
        selectedRole="ROLE_1"
        organisationId=""
        isSavingRole={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onSelectedRoleChange={vi.fn()}
        onOrganisationIdChange={vi.fn()}
        userOrganisations={[]}
      />
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getAllByText('No organisations available').length).toBeGreaterThan(0);
    expect(screen.getByText('Please ensure the user has at least one organisation.')).toBeInTheDocument();
  });
});
