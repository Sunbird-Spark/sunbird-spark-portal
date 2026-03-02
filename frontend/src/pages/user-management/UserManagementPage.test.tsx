import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import UserManagementPage from './UserManagementPage';

/* ── Shared mocks ────────────────────────────────────────────────────── */

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: null }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: { isUserAuthenticated: () => true, getUserId: () => 'uid1', getAuthInfo: vi.fn() },
}));

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (k: string) => k }),
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: { data: { response: MOCK_USER } },
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => ({ data: {}, isSuccess: false }),
}));

vi.mock('@/hooks/useTnc', () => ({
  useGetTncUrl: () => ({ data: '' }),
  useAcceptTnc: () => ({ mutateAsync: vi.fn() }),
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

vi.mock("@/components/common/Select", () => ({
  Select: ({ children, onValueChange, value }: any) => {
    const trigger = React.Children.toArray(children).find((c: any) => c.props?.id) as any;
    return (
      <select 
        id={trigger?.props?.id}
        value={value} 
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {children}
      </select>
    );
  },
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

const mockSearchUser = vi.fn();
const mockGetRoles = vi.fn();
const mockAssignRole = vi.fn();

vi.mock('@/services/UserManagementService', () => ({
  userManagementService: {
    searchUser: (...args: any[]) => mockSearchUser(...args),
    getRoles: (...args: any[]) => mockGetRoles(...args),
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
  roles: [{ role: 'CONTENT_CREATOR', scope: [{ organisationId: 'org1' }], createdDate: '', updatedDate: null, userId: 'user1' }],
  rootOrgName: 'Test Org',
  rootOrgId: 'org1',
  rootOrg: {
    id: 'org1',
    orgName: 'Root Org Name',
  },
  channel: 'test',
  organisations: [
    { organisationId: 'org1', orgName: 'Test Org' },
    { organisationId: 'org2', orgName: 'Other Org' },
  ],
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter>
        <UserManagementPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/* ── Tests ───────────────────────────────────────────────────────────── */

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRoles.mockResolvedValue({ data: { result: { response: { roleList: MOCK_ROLES } } }, status: 200, headers: {} });
    mockSearchUser.mockResolvedValue({ data: { response: { content: [] } }, status: 200, headers: {} });
    mockAssignRole.mockResolvedValue({ data: {}, status: 200, headers: {} });
  });

  /* ── Layout ── */
  describe('layout', () => {
    it('renders the page title "User Management"', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('renders the "Change User Roles" sidebar tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Change User Roles')).toBeInTheDocument();
      });
    });
  });

  /* ── Search ── */
  describe('Role Management tab – search', () => {
    it('renders the search input', () => {
      renderPage();
      expect(screen.getByPlaceholderText('Search User by Sunbird ID')).toBeInTheDocument();
    });

    it('shows initial prompt before any search', () => {
      renderPage();
      expect(screen.getByText('Enter a Sunbird ID above and click Search to find users')).toBeInTheDocument();
    });

    it('calls searchUser with the entered query on button click', async () => {
      renderPage();
      const input = screen.getByPlaceholderText('Search User by Sunbird ID');
      fireEvent.change(input, { target: { value: 'alicesmith' } });
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(mockSearchUser).toHaveBeenCalledWith('alicesmith');
      });
    });

    it('calls searchUser on Enter key press', async () => {
      renderPage();
      const input = screen.getByPlaceholderText('Search User by Sunbird ID');
      fireEvent.change(input, { target: { value: 'alicesmith' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockSearchUser).toHaveBeenCalledWith('alicesmith');
      });
    });

    it('shows "No users found" when search returns empty results', async () => {
      renderPage();
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

      renderPage();
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

      renderPage();
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

      renderPage();
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

    renderPage();
    fireEvent.change(screen.getByPlaceholderText('Search User by Sunbird ID'), { target: { value: 'alice' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  /* ── Add role dialog ── */
  describe('Add Role dialog', () => {
    async function openAddRoleDialog() {
      mockSearchUser.mockResolvedValue({
        data: { response: { content: [MOCK_USER] } },
        status: 200,
        headers: {},
      });

      renderPage();
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

    it('successfully adds a role using the organization dropdown', async () => {
      await openAddRoleDialog();

      const roleSelect = screen.getByLabelText(/role/i, { selector: 'select' });
      const orgSelect = screen.getByLabelText(/organisation name/i, { selector: 'select' });

      fireEvent.change(roleSelect, { target: { value: 'ORG_ADMIN' } });
      fireEvent.change(orgSelect, { target: { value: 'org1' } });

      // Click Add (exact match to avoid "Add Role" button)
      fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

      await waitFor(() => {
        expect(mockAssignRole).toHaveBeenCalledWith(
          'user1',
          'ORG_ADMIN',
          'org1',
          'add'
        );
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

      renderPage();
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

  /* ── Roles loaded on mount ── */
  it('loads available roles from the API on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(mockGetRoles).toHaveBeenCalled();
    });
  });

  /* ── Tab switching ── */
  it('has the "Change User Roles" tab active by default', () => {
    renderPage();
    const tab = screen.getByText('Change User Roles');
    expect(tab.closest('button')).toHaveClass('border-sunbird-brick', 'text-sunbird-brick');
  });
});
