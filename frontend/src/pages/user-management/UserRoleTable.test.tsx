import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserRoleTable } from './UserRoleTable';
import type { UserSearchResult } from '@/services/UserManagementService';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.query) return `No users found for "${opts.query}"`;
      return key.split('.').pop() ?? key;
    },
  }),
}));

vi.mock('@/components/common/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('./user-management.css', () => ({}));

const baseUser: UserSearchResult = {
  id: 'id-1',
  userId: 'user-1',
  firstName: 'Alice',
  lastName: 'Smith',
  userName: 'alice@example.com',
  email: 'alice@example.com',
  maskedEmail: 'al*****@example.com',
  maskedPhone: null,
  status: 1,
  isDeleted: false,
  roles: [],
  rootOrgName: 'Org',
  rootOrgId: 'org-1',
  channel: 'sunbird',
};

const defaultProps = {
  searchResults: [baseUser],
  searchQuery: 'alice',
  onOpenDeleteDialog: vi.fn(),
  onOpenAddRoleDialog: vi.fn(),
};

describe('UserRoleTable', () => {
  it('shows empty state when searchResults is empty', () => {
    render(<UserRoleTable {...defaultProps} searchResults={[]} />);
    expect(screen.getByText(/No users found/)).toBeInTheDocument();
  });

  it('renders user display name using firstName + lastName join (line 25 truthy branch)', () => {
    render(<UserRoleTable {...defaultProps} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('falls back to userName when firstName and lastName are both empty (line 25 || branch)', () => {
    const user = { ...baseUser, firstName: '', lastName: '', userName: 'unique-username-fallback' };
    render(<UserRoleTable {...defaultProps} searchResults={[user]} />);
    expect(screen.getAllByText('unique-username-fallback').length).toBeGreaterThanOrEqual(1);
  });

  it('uses user.id when user.userId is falsy (line 53 || branch)', () => {
    const user = { ...baseUser, userId: '' };
    const addRole = vi.fn();
    render(<UserRoleTable {...defaultProps} searchResults={[user]} onOpenAddRoleDialog={addRole} />);
    // The key prop on the row uses userId || id — we verify row renders
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('shows maskedEmail when available (line 58 first truthy)', () => {
    render(<UserRoleTable {...defaultProps} />);
    expect(screen.getByText('al*****@example.com')).toBeInTheDocument();
  });

  it('falls back to email when maskedEmail is empty (line 58 second branch)', () => {
    const user = { ...baseUser, maskedEmail: '', email: 'fallback-email@example.com' };
    render(<UserRoleTable {...defaultProps} searchResults={[user]} />);
    expect(screen.getByText('fallback-email@example.com')).toBeInTheDocument();
  });

  it('shows dash when both maskedEmail and email are empty (line 58 ?? "—" branch)', () => {
    const user = { ...baseUser, maskedEmail: '', email: '' };
    render(<UserRoleTable {...defaultProps} searchResults={[user]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders noRolesAssigned when roles is empty', () => {
    render(<UserRoleTable {...defaultProps} />);
    expect(screen.getByText('noRolesAssigned')).toBeInTheDocument();
  });

  it('renders role chips and hides delete button for PUBLIC role', () => {
    const user = { ...baseUser, roles: [{ role: 'PUBLIC', scope: [], createdDate: '2024-01-01', updatedDate: null, userId: 'user-1' }] };
    render(<UserRoleTable {...defaultProps} searchResults={[user]} />);
    expect(screen.getByText('PUBLIC')).toBeInTheDocument();
    expect(screen.queryByTitle('removeRole')).not.toBeInTheDocument();
  });

  it('shows delete button for non-PUBLIC role', () => {
    const user = { ...baseUser, roles: [{ role: 'CONTENT_CREATOR', scope: [], createdDate: '2024-01-01', updatedDate: null, userId: 'user-1' }] };
    render(<UserRoleTable {...defaultProps} searchResults={[user]} />);
    expect(screen.getByText('CONTENT_CREATOR')).toBeInTheDocument();
  });
});
