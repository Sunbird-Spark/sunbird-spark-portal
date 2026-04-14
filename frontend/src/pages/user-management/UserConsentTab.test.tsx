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

    it('does not render checkboxes in the table', () => {
      renderTab();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
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

    it('does not crash when a record has no email and a search is active', async () => {
      vi.spyOn(useConsentSummaryModule, 'useConsentSummary').mockReturnValueOnce({
        data: [
          { ...MOCK_DATA[0]!, email: undefined as unknown as string },
          MOCK_DATA[1]!,
        ],
        isLoading: false,
        isError: false,
      });
      renderTab();
      fireEvent.change(screen.getByPlaceholderText('Search by name or email…'), {
        target: { value: 'Aarav' },
      });

      await waitFor(() => {
        expect(screen.getAllByText('Aarav Mehta').length).toBeGreaterThan(0);
      });
    });
  });
});
