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
  useAppI18n: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'exportButton.exportCsv': 'Export CSV',
        'exportButton.noDataToExport': 'No data to export',
        'exportButton.csvExportedSuccessfully': 'CSV exported successfully',
        'userManagement.pageTitle': 'User Management',
        'userManagement.addRole': 'Add Role',
        'userManagement.tabs.changeUserRoles': 'Change User Roles',
        'userManagement.tabs.userConsent': 'User Consent',
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
        'userManagement.deleteRoleDialog.title': 'Remove Role',
        'userManagement.deleteRoleDialog.confirmDesc': 'Are you sure you want to remove the role "{{role}}"?',
        'userManagement.deleteRoleDialog.confirmDescFallback': 'Are you sure you want to remove this role?',
        'userManagement.deleteRoleDialog.remove': 'Remove',
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
        'userManagement.consentTab.loading': 'Loading consent data…',
        'userManagement.consentTab.loadFailed': 'Failed to load consent data.',
        'userManagement.consentTab.totalUsers': 'Total Users',
        'userManagement.consentTab.consentGranted': 'Consent Granted',
        'userManagement.consentTab.consentRevoked': 'Consent Revoked',
        'userManagement.consentTab.filterLabel': 'Consent Status',
        'userManagement.consentTab.filterGranted': 'Granted',
        'userManagement.consentTab.filterRevoked': 'Revoked',
        'userManagement.consentTab.searchPlaceholder': 'Search by name or email…',
        'userManagement.consentTab.noUsersMatch': 'No users match the current filters.',
        'userManagement.consentTab.revokeTitle': 'Revoke Consent',
        'userManagement.consentTab.reissueTitle': 'Reissue Consent',
        'userManagement.consentTab.revokeTitleBulk': 'Revoke Consent ({{count}} users)',
        'userManagement.consentTab.reissueTitleBulk': 'Reissue Consent ({{count}} users)',
        'userManagement.consentTab.revokeDesc': 'This will revoke PII consent.',
        'userManagement.consentTab.reissueDesc': 'This will reissue PII consent.',
        'userManagement.consentTab.revokedToast': 'Consent revoked for {{count}} user(s)',
        'userManagement.consentTab.reissuedToast': 'Consent reissued for {{count}} user(s)',
        'userManagement.consentColumns.selectedCount': '{{count}} user(s) selected',
        'userManagement.consentColumns.selectAll': 'Select All ({{count}})',
        'userManagement.consentColumns.clear': 'Clear',
        'userManagement.consentColumns.reissueConsent': 'Reissue Consent',
        'userManagement.consentColumns.revokeConsent': 'Revoke Consent',
        'userManagement.consentColumns.selectUser': 'Select {{name}}',
        'userManagement.consentColumns.colUserName': 'User Name',
        'userManagement.consentColumns.colEmail': 'Email',
        'userManagement.consentColumns.colPiiStatus': 'PII Consent Status',
        'userManagement.consentColumns.colCourse': 'Course',
        'userManagement.consentColumns.colConsentGivenOn': 'Consent Given On',
        'userManagement.consentColumns.colExpiry': 'Expiry',
        'dataTable.noData': 'No data available.',
        'dataTable.showing': 'Showing {{from}}–{{to}} of {{total}}',
        'dataTable.pageIndicator': '{{page}} / {{total}}',
        'dataTable.firstPage': 'First page',
        'dataTable.prevPage': 'Previous page',
        'dataTable.nextPage': 'Next page',
        'dataTable.lastPage': 'Last page',
        'filterPanel.searchPlaceholder': 'Search…',
        'filterPanel.allOption': 'All {{label}}',
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

vi.mock('@/hooks/useConsentSummary', () => ({
  useConsentSummary: () => ({ data: [], isLoading: false, isError: false }),
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

// Radix Select used by FilterPanel inside UserConsentTab
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select value={value} onChange={(e: any) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
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

  /* ── User Consent tab ── */
  describe('User Consent tab', () => {
    it('renders the "User Consent" tab button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /user consent/i })).toBeInTheDocument();
    });

    it('clicking "User Consent" makes it the active tab', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /user consent/i }));
      expect(
        screen.getByRole('button', { name: /user consent/i })
      ).toHaveClass('border-sunbird-brick', 'text-sunbird-brick');
    });

    it('"Change User Roles" tab becomes inactive when "User Consent" is clicked', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /user consent/i }));
      expect(
        screen.getByRole('button', { name: /change user roles/i })
      ).not.toHaveClass('border-sunbird-brick');
    });

    it('clicking "User Consent" renders the consent summary cards', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /user consent/i }));

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Consent Granted')).toBeInTheDocument();
        expect(screen.getByText('Consent Revoked')).toBeInTheDocument();
      });
    });

    it('clicking "User Consent" renders the search input', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /user consent/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by name or email…')).toBeInTheDocument();
      });
    });

    it('clicking "User Consent" renders the Export CSV button', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /user consent/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
      });
    });

    it('switching back to "Change User Roles" hides the consent content', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /user consent/i }));
      await waitFor(() => screen.getByText('Total Users'));

      fireEvent.click(screen.getByRole('button', { name: /change user roles/i }));

      await waitFor(() => {
        expect(screen.queryByText('Total Users')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search User by Sunbird ID')).toBeInTheDocument();
      });
    });
  });
});
