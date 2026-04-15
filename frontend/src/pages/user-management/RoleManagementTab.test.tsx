import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import RoleManagementTab from './RoleManagementTab';

/* ── Shared mocks ────────────────────────────────────────────────────── */

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock('@/hooks/useAuthInfo', () => ({
  useAuthInfo: () => ({ data: null }),
  useUserId: () => null,
  useIsAuthenticated: () => ({ isAuthenticated: false, isLoading: false }),
  useSessionId: () => null,
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'userManagement.addRole': 'Add Role',
        'userManagement.roleManagement.searchPlaceholder': 'Search User by Sunbird ID',
        'userManagement.roleManagement.searching': 'Searching...',
        'userManagement.roleManagement.search': 'Search',
        'userManagement.roleManagement.initialHint': 'Enter a Sunbird ID above and click Search to find users',
        'userManagement.roleManagement.searchingUsers': 'Searching users...',
        'userManagement.roleDialog.addTitle': 'Add New Role',
        'userManagement.roleDialog.editTitle': 'Edit Role',
        'userManagement.roleDialog.close': 'Close',
        'userManagement.roleDialog.roleLabel': 'Role',
        'userManagement.roleDialog.orgLabel': 'Organisation Name',
        'userManagement.roleDialog.selectRole': 'Select a role',
        'userManagement.roleDialog.selectOrg': 'Select an organisation',
        'userManagement.roleDialog.noOrgs': 'No organisations available',
        'userManagement.roleDialog.noOrgHint': 'Please ensure the user has at least one organisation.',
        'userManagement.roleDialog.cancel': 'Cancel',
        'userManagement.roleDialog.saving': 'Saving...',
        'userManagement.roleDialog.add': 'Add',
        'userManagement.roleDialog.save': 'Save',
        'userManagement.userRoleTable.active': 'Active',
        'userManagement.userRoleTable.inactive': 'Inactive',
        'userManagement.userRoleTable.noUsersFound': 'No users found for "{{query}}"',
        'userManagement.userRoleTable.colNumber': '#',
        'userManagement.userRoleTable.colName': 'Name',
        'userManagement.userRoleTable.colEmail': 'Email',
        'userManagement.userRoleTable.colUsername': 'Username',
        'userManagement.userRoleTable.colStatus': 'Status',
        'userManagement.userRoleTable.colCurrentRoles': 'Current Roles',
        'userManagement.userRoleTable.colActions': 'Actions',
        'userManagement.userRoleTable.noRolesAssigned': 'No roles assigned',
        'userManagement.userRoleTable.removeRole': 'Remove role',
        'userManagement.userRoleTable.removeRoleAriaLabel': 'Remove role {{role}}',
        'userManagement.userRoleTable.addRole': 'Add Role',
        'userManagement.userRoleTable.addNewRole': 'Add a new role',
      };
      return map[k] ?? k;
    },
    languages: [],
    currentCode: 'en',
    currentLanguage: { code: 'en', label: 'English', dir: 'ltr', index: 1, font: "'Rubik', sans-serif" },
    changeLanguage: vi.fn(),
    isRTL: false,
    dir: 'ltr',
  }),
}));

vi.mock('@/components/common/ConfirmDialog', () => ({
  default: ({ open, onConfirm, onClose }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

const mockSearchUser = vi.fn();
const mockAssignRole = vi.fn();

vi.mock('@/services/UserManagementService', () => ({
  userManagementService: {
    searchUser: (...args: any[]) => mockSearchUser(...args),
    assignRole: (...args: any[]) => mockAssignRole(...args),
  },
}));

/* ── Helpers ─────────────────────────────────────────────────────────── */

const MOCK_ROLES = [
  { id: 'CONTENT_CREATOR', name: 'Content Creator', actionGroups: [] },
  { id: 'ORG_ADMIN', name: 'Org Admin', actionGroups: [] },
];

const MOCK_USER = {
  userId: 'user1',
  id: 'user1',
  firstName: 'Alice',
  lastName: 'Smith',
  userName: 'alicesmith',
  email: 'alice@example.com',
  maskedEmail: 'al***@example.com',
  maskedPhone: null,
  status: 1,
  isDeleted: false,
  roles: [
    { role: 'CONTENT_CREATOR', scope: [{ organisationId: 'org1' }], createdDate: '', updatedDate: null, userId: 'user1' },
    { role: 'ORG_ADMIN', scope: [{ organisationId: 'org1' }], createdDate: '', updatedDate: null, userId: 'user1' },
  ],
  rootOrgName: 'Test Org',
  rootOrgId: 'org1',
  channel: 'test',
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function renderComponent() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <RoleManagementTab availableRoles={MOCK_ROLES} onRefreshSearch={vi.fn()} userOrganisations={[]} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/* ── Tests ───────────────────────────────────────────────────────────── */

describe('RoleManagementTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchUser.mockResolvedValue({ data: { response: { content: [] } }, status: 200, headers: {} });
    mockAssignRole.mockResolvedValue({ data: {}, status: 200, headers: {} });
  });

  describe('search', () => {
    it('renders the search input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Search User by Sunbird ID')).toBeInTheDocument();
    });

    it('shows initial prompt before any search', () => {
      renderComponent();
      expect(screen.getByText('Enter a Sunbird ID above and click Search to find users')).toBeInTheDocument();
    });

    it('calls searchUser with the entered query on button click', async () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Search User by Sunbird ID');
      fireEvent.change(input, { target: { value: 'alicesmith' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(mockSearchUser).toHaveBeenCalledWith('alicesmith');
      });
    });

    it('calls searchUser on Enter key press', async () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Search User by Sunbird ID');
      fireEvent.change(input, { target: { value: 'alicesmith' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSearchUser).toHaveBeenCalledWith('alicesmith');
      });
    });

    it('shows "No users found" when search returns empty results', async () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Search User by Sunbird ID');
      fireEvent.change(input, { target: { value: 'unknown' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText(/No users found/)).toBeInTheDocument();
      });
    });

    it('renders user result rows when search returns results', async () => {
      mockSearchUser.mockResolvedValue({
        data: { response: { content: [MOCK_USER] } },
        status: 200,
        headers: {},
      });

      renderComponent();
      const input = screen.getByPlaceholderText('Search User by Sunbird ID');
      fireEvent.change(input, { target: { value: 'alicesmith' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('alicesmith')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('shows existing roles as chips in the table', async () => {
      mockSearchUser.mockResolvedValue({
        data: { response: { content: [MOCK_USER] } },
        status: 200,
        headers: {},
      });

      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Search User by Sunbird ID'), { target: { value: 'alice' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('CONTENT_CREATOR')).toBeInTheDocument();
      });
    });

    it('shows "No roles assigned" when user has no roles', async () => {
      const userWithNoRoles = { ...MOCK_USER, roles: [] };
      mockSearchUser.mockResolvedValue({
        data: { response: { content: [userWithNoRoles] } },
        status: 200,
        headers: {},
      });

      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Search User by Sunbird ID'), { target: { value: 'alice' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('No roles assigned')).toBeInTheDocument();
      });
    });
  });

  /* ── Inactive status ── */
  it('shows "Inactive" badge for users with status !== 1', async () => {
    const inactiveUser = { ...MOCK_USER, status: 0 };
    mockSearchUser.mockResolvedValue({
      data: { response: { content: [inactiveUser] } },
      status: 200,
      headers: {},
    });

    renderComponent();
    fireEvent.change(screen.getByPlaceholderText('Search User by Sunbird ID'), { target: { value: 'alice' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  /* ── Add role dialog ── */
  describe('Add Role dialog interaction via child RoleDialog', () => {
    async function openAddRoleDialog() {
      mockSearchUser.mockResolvedValue({
        data: { response: { content: [MOCK_USER] } },
        status: 200,
        headers: {},
      });

      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Search User by Sunbird ID'), { target: { value: 'alice' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => screen.getByText('Alice Smith'));
      fireEvent.click(screen.getByRole('button', { name: /add role/i }));
    }

    it('opens the Add Role dialog when "Add Role" button is clicked', async () => {
      await openAddRoleDialog();
      expect(screen.getByText('Add New Role')).toBeInTheDocument();
    });

    it('closes the dialog when Cancel is clicked', async () => {
      await openAddRoleDialog();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      await waitFor(() => {
        expect(screen.queryByText('Add New Role')).toBeNull();
      });
    });
  });

  /* ── Delete role dialog ── */
  describe('Delete Role confirmation', () => {
    async function openDeleteDialog() {
      mockSearchUser.mockResolvedValue({
        data: { response: { content: [MOCK_USER] } },
        status: 200,
        headers: {},
      });

      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Search User by Sunbird ID'), { target: { value: 'alice' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => screen.getByText('CONTENT_CREATOR'));
      fireEvent.click(screen.getByRole('button', { name: /Remove role CONTENT_CREATOR/i }));
    }

    it('opens the ConfirmDialog when remove role button is clicked', async () => {
      await openDeleteDialog();
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    it('calls assignRole with "remove" operation on confirm', async () => {
      await openDeleteDialog();
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockAssignRole).toHaveBeenCalledWith('user1', 'CONTENT_CREATOR', 'org1', 'remove');
      });
    });

    it('closes dialog on cancel without calling assignRole', async () => {
      await openDeleteDialog();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).toBeNull();
      });
      expect(mockAssignRole).not.toHaveBeenCalled();
    });
  });
});
