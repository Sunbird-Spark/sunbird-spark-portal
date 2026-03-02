import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserConsentTab from './UserConsentTab';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

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
// SelectTrigger/SelectValue must render null — <span> inside <select> is invalid HTML.
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

  /* ── Layout ── */
  describe('layout', () => {
    it('renders the Export CSV button', () => {
      renderTab();
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });

    it('renders all four summary card labels', () => {
      renderTab();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Consent Granted')).toBeInTheDocument();
      expect(screen.getByText('Consent Pending')).toBeInTheDocument();
      expect(screen.getByText('Consent Revoked')).toBeInTheDocument();
    });

    it('shows the correct Total Users count (40)', () => {
      renderTab();
      expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderTab();
      expect(screen.getByPlaceholderText('Search by name or email…')).toBeInTheDocument();
    });

    it('renders user rows in the table (first page)', () => {
      renderTab();
      expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    it('renders PII Consent Status badges', () => {
      renderTab();
      expect(screen.getAllByText('Granted').length).toBeGreaterThan(0);
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
        target: { value: 'user1@example.org' },
      });

      await waitFor(() => {
        expect(screen.getByText('user1@example.org')).toBeInTheDocument();
        expect(screen.queryByText('user2@example.org')).not.toBeInTheDocument();
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
        expect(screen.getByText(/40 user\(s\) selected/)).toBeInTheDocument();
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
