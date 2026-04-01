import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserConsentTab from './UserConsentTab';
import type { UserConsentRecord } from '@/types/reports';
import * as useConsentSummaryModule from '@/hooks/useConsentSummary';

/* ── Mock data ───────────────────────────────────────────────────────────── */

const MOCK_DATA: UserConsentRecord[] = [
  {
    id: 'uid1_oid1_0',
    userId: 'uid1',
    userName: 'Aarav Mehta',
    email: 'ar*****@yopmail.com',
    consentStatus: 'Granted',
    course: 'Business and Management',
    consentGivenOn: '2026-03-01',
    expiry: '2026-06-01',
  },
  {
    id: 'uid2_oid2_1',
    userId: 'uid2',
    userName: 'Priya Sharma',
    email: 'pr*****@yopmail.com',
    consentStatus: 'Revoked',
    course: 'Finance and Accounting',
    consentGivenOn: '2026-02-10',
    expiry: '2026-05-10',
  },
  {
    id: 'uid3_oid3_2',
    userId: 'uid3',
    userName: 'Rohan Gupta',
    email: 'ro*****@yopmail.com',
    consentStatus: 'Granted',
    course: 'Information Technology',
    consentGivenOn: '2026-03-15',
    expiry: '2026-06-15',
  },
];

/* ── Mocks ───────────────────────────────────────────────────────────────── */

vi.mock('@/hooks/useConsentSummary', () => ({
  useConsentSummary: () => ({ data: MOCK_DATA, isLoading: false, isError: false }),
}));

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (k: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'exportButton.exportCsv': 'Export CSV',
        'exportButton.noDataToExport': 'No data to export',
        'exportButton.csvExportedSuccessfully': 'CSV exported successfully',
        'userManagement.consentTab.loading': 'Loading consent data…',
        'userManagement.consentTab.loadFailed': 'Failed to load consent data. Please try again later.',
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
        'userManagement.consentColumns.bulkActions': 'Bulk actions',
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

vi.mock('@/components/common/ConfirmDialog', () => ({
  default: ({ open, title, onConfirm, onClose }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span data-testid="confirm-title">{title}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

// Radix Select → plain <select> so fireEvent.change works.
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

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function renderTab() {
  return render(<UserConsentTab />);
}

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('UserConsentTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── Loading / error states ── */
  describe('loading and error states', () => {
    it('shows loading indicator while fetching', () => {
      vi.spyOn(useConsentSummaryModule, 'useConsentSummary').mockReturnValueOnce({ data: [], isLoading: true, isError: false });
      renderTab();
      expect(screen.getByText(/loading consent data/i)).toBeInTheDocument();
    });

    it('shows error message on failure', () => {
      vi.spyOn(useConsentSummaryModule, 'useConsentSummary').mockReturnValueOnce({ data: [], isLoading: false, isError: true });
      renderTab();
      expect(screen.getByText(/failed to load consent data/i)).toBeInTheDocument();
    });
  });

  /* ── Layout ── */
  describe('layout', () => {
    it('renders the Export CSV button', () => {
      renderTab();
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });

    it('renders summary card labels', () => {
      renderTab();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Consent Granted')).toBeInTheDocument();
      expect(screen.getByText('Consent Revoked')).toBeInTheDocument();
    });

    it('shows the correct Total Users count', () => {
      renderTab();
      expect(screen.getByText(String(MOCK_DATA.length))).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderTab();
      expect(screen.getByPlaceholderText('Search by name or email…')).toBeInTheDocument();
    });

    it('renders user rows in the table', () => {
      renderTab();
      expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    it('renders PII Consent Status badges', () => {
      renderTab();
      expect(screen.getAllByText('Granted').length).toBeGreaterThan(0);
    });

    it('renders the Expiry column header', () => {
      renderTab();
      expect(screen.getByText('Expiry')).toBeInTheDocument();
    });

    it('does not render Consumer Org(s) column', () => {
      renderTab();
      expect(screen.queryByText('Consumer Org(s)')).not.toBeInTheDocument();
    });

    it('does not show the bulk actions toolbar by default', () => {
      renderTab();
      expect(screen.queryByRole('toolbar', { name: /bulk actions/i })).not.toBeInTheDocument();
    });
  });

  /* ── Search filter ── */
  describe('search filter', () => {
    it('filters the table when searching by name', async () => {
      renderTab();
      fireEvent.change(screen.getByPlaceholderText('Search by name or email…'), {
        target: { value: 'Aarav' },
      });

      await waitFor(() => {
        expect(screen.getAllByText('Aarav Mehta').length).toBeGreaterThan(0);
        expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
      });
    });

    it('filters the table when searching by email', async () => {
      renderTab();
      fireEvent.change(screen.getByPlaceholderText('Search by name or email…'), {
        target: { value: 'ar*****' },
      });

      await waitFor(() => {
        expect(screen.getByText('ar*****@yopmail.com')).toBeInTheDocument();
        expect(screen.queryByText('pr*****@yopmail.com')).not.toBeInTheDocument();
      });
    });

    it('shows empty message when search matches no users', async () => {
      renderTab();
      fireEvent.change(screen.getByPlaceholderText('Search by name or email…'), {
        target: { value: 'xyznonexistent' },
      });

      await waitFor(() => {
        expect(screen.getByText('No users match the current filters.')).toBeInTheDocument();
      });
    });
  });

  /* ── Row selection ── */
  describe('row selection', () => {
    it('shows the bulk actions toolbar when a row is checked', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      expect(screen.getByRole('toolbar', { name: /bulk actions/i })).toBeInTheDocument();
      expect(screen.getByText(/1 user\(s\) selected/)).toBeInTheDocument();
    });

    it('increments selected count when multiple rows are checked', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      fireEvent.click(screen.getByLabelText('Select Priya Sharma'));
      expect(screen.getByText(/2 user\(s\) selected/)).toBeInTheDocument();
    });

    it('deselects a row when its checkbox is clicked again', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      expect(screen.queryByRole('toolbar', { name: /bulk actions/i })).not.toBeInTheDocument();
    });

    it('hides the bulk actions toolbar after clicking Clear', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      fireEvent.click(screen.getByRole('button', { name: /clear/i }));
      expect(screen.queryByRole('toolbar', { name: /bulk actions/i })).not.toBeInTheDocument();
    });

    it('selects all filtered rows when "Select All" is clicked', async () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      fireEvent.click(screen.getByRole('button', { name: /select all/i }));

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${MOCK_DATA.length} user\\(s\\) selected`))).toBeInTheDocument();
      });
    });

    it('clears selection when search input changes', async () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      expect(screen.getByText(/1 user\(s\) selected/)).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Search by name or email…'), {
        target: { value: 'something' },
      });

      await waitFor(() => {
        expect(screen.queryByRole('toolbar', { name: /bulk actions/i })).not.toBeInTheDocument();
      });
    });
  });

  /* ── Bulk actions ── */
  describe('bulk actions toolbar', () => {
    it('shows "Revoke Consent" bulk button in the toolbar', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      expect(screen.getByRole('button', { name: /^revoke consent$/i })).toBeInTheDocument();
    });

    it('shows "Reissue Consent" bulk button in the toolbar', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      expect(screen.getByRole('button', { name: /reissue consent/i })).toBeInTheDocument();
    });

    it('bulk Revoke Consent dialog title includes user count', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      fireEvent.click(screen.getByLabelText('Select Priya Sharma'));
      fireEvent.click(screen.getByRole('button', { name: /^revoke consent$/i }));
      expect(screen.getByTestId('confirm-title')).toHaveTextContent('Revoke Consent (2 users)');
    });

    it('bulk Reissue Consent dialog title includes user count', () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      fireEvent.click(screen.getByRole('button', { name: /reissue consent/i }));
      expect(screen.getByTestId('confirm-title')).toHaveTextContent('Reissue Consent (1 users)');
    });

    it('clears selection after confirming bulk revoke', async () => {
      renderTab();
      fireEvent.click(screen.getByLabelText('Select Aarav Mehta'));
      fireEvent.click(screen.getByRole('button', { name: /^revoke consent$/i }));
      fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

      await waitFor(() => {
        expect(screen.queryByRole('toolbar', { name: /bulk actions/i })).not.toBeInTheDocument();
      });
    });
  });
});
