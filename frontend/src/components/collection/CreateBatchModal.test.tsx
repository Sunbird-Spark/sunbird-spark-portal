import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateBatchModal from './CreateBatchModal';

/* ── Mock useLearnerFuzzySearch ── */
const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useUser', () => ({
  useLearnerFuzzySearch: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

/* ── Helpers ── */
const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  collectionId: 'col-123',
};

/** Wrapper that controls open state so we can test open → close → reopen flows */
const ControlledModal = ({ collectionId = 'col-123' }: { collectionId?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open Modal
      </button>
      <CreateBatchModal open={open} onOpenChange={setOpen} collectionId={collectionId} />
    </>
  );
};

describe('CreateBatchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ────────────────────────────────────── Visibility ── */
  describe('Visibility', () => {
    it('renders the modal title when open is true', () => {
      render(<CreateBatchModal {...defaultProps} />);
      // Dialog.Title renders as a heading; use role to avoid matching the submit button
      expect(screen.getByRole('heading', { name: 'Create Batch' })).toBeInTheDocument();
    });

    it('does not render form content when open is false', () => {
      render(<CreateBatchModal {...defaultProps} open={false} />);
      expect(screen.queryByPlaceholderText('Enter batch name')).not.toBeInTheDocument();
    });

    it('shows modal after open is changed to true', () => {
      render(<ControlledModal />);
      expect(screen.queryByPlaceholderText('Enter batch name')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Open Modal'));
      expect(screen.getByPlaceholderText('Enter batch name')).toBeInTheDocument();
    });
  });

  /* ────────────────────────────────────── Form fields ── */
  describe('Form fields', () => {
    it('renders Name of Batch input as required', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter batch name');
      expect(input).toBeInTheDocument();
      expect(input).toBeRequired();
    });

    it('renders About Batch textarea', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(
        screen.getByPlaceholderText('Brief description about this batch')
      ).toBeInTheDocument();
    });

    it('renders Start Date input as required', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const el = screen.getByLabelText(/start date/i);
      expect(el).toBeInTheDocument();
      expect(el).toBeRequired();
    });

    it('renders End Date input as required', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const el = screen.getByLabelText(/end date \*/i);
      expect(el).toBeInTheDocument();
      expect(el).toBeRequired();
    });

    it('renders Enrolment End Date input (not required)', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const el = screen.getByLabelText(/enrolment end date/i);
      expect(el).toBeInTheDocument();
      expect(el).not.toBeRequired();
    });

    it('renders Issue Certificate switch', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByText('Issue Certificate')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /issue certificate/i })).toBeInTheDocument();
    });

    it('renders Terms & Conditions checkbox', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByText(/i accept the terms & conditions/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders mentor search input', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(
        screen.getByPlaceholderText(/search mentors by name or identifier/i)
      ).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders a Close (X) button', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
    });
  });

  /* ──────────────── Enable Discussion is disabled (commented out) ── */
  describe('Enable Discussion (disabled)', () => {
    it('does NOT render an Enable Discussion switch', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.queryByText('Enable Discussion')).not.toBeInTheDocument();
    });

    it('does NOT render a switch for Enable Discussion', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const switches = screen.queryAllByRole('switch', { name: /enable discussion/i });
      expect(switches).toHaveLength(0);
    });
  });

  /* ───────────────────────────── Batch Type — static text "Open" ── */
  describe('Batch Type', () => {
    it('renders "Batch Type" label', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByText('Batch Type')).toBeInTheDocument();
    });

    it('renders "Open" as static text beside the label', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('does NOT render a switch for Batch Type', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(
        screen.queryByRole('switch', { name: /batch type/i })
      ).not.toBeInTheDocument();
    });

    it('"Open" text is not inside a button', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const openText = screen.getByText('Open');
      expect(openText.tagName).not.toBe('BUTTON');
      expect(openText.closest('button')).toBeNull();
    });
  });

  /* ───────────────────────────────────── Issue Certificate switch ── */
  describe('Issue Certificate switch', () => {
    it('starts unchecked (aria-checked=false)', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const sw = screen.getByRole('switch', { name: /issue certificate/i });
      expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    it('toggles to checked when clicked once', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const sw = screen.getByRole('switch', { name: /issue certificate/i });
      fireEvent.click(sw);
      expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    it('toggles back to unchecked when clicked twice', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const sw = screen.getByRole('switch', { name: /issue certificate/i });
      fireEvent.click(sw);
      fireEvent.click(sw);
      expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  });

  /* ─────────────────────────────────────── Submit button state ── */
  describe('Submit button disabled state', () => {
    it('is disabled when all required fields are empty', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /^create batch$/i })).toBeDisabled();
    });

    it('remains disabled with only batch name filled', () => {
      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText('Enter batch name'), {
        target: { value: 'My Batch' },
      });
      expect(screen.getByRole('button', { name: /^create batch$/i })).toBeDisabled();
    });

    it('remains disabled with name + dates but without T&C', () => {
      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText('Enter batch name'), {
        target: { value: 'My Batch' },
      });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: '2026-03-01' },
      });
      fireEvent.change(screen.getByLabelText(/end date \*/i), {
        target: { value: '2026-04-01' },
      });
      expect(screen.getByRole('button', { name: /^create batch$/i })).toBeDisabled();
    });

    it('becomes enabled when name, start date, end date and T&C are all filled', () => {
      render(<CreateBatchModal {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('Enter batch name'), {
        target: { value: 'Batch One' },
      });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: '2026-03-01' },
      });
      fireEvent.change(screen.getByLabelText(/end date \*/i), {
        target: { value: '2026-04-01' },
      });
      fireEvent.click(screen.getByRole('checkbox')); // T&C

      expect(screen.getByRole('button', { name: /^create batch$/i })).not.toBeDisabled();
    });

    it('goes back to disabled after unchecking T&C', () => {
      render(<CreateBatchModal {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText('Enter batch name'), {
        target: { value: 'Batch One' },
      });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: '2026-03-01' },
      });
      fireEvent.change(screen.getByLabelText(/end date \*/i), {
        target: { value: '2026-04-01' },
      });
      fireEvent.click(screen.getByRole('checkbox')); // check
      fireEvent.click(screen.getByRole('checkbox')); // uncheck

      expect(screen.getByRole('button', { name: /^create batch$/i })).toBeDisabled();
    });
  });

  /* ────────────────────────────────────── Close / Cancel ── */
  describe('Close and Cancel behaviour', () => {
    it('calls onOpenChange(false) when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      render(<CreateBatchModal {...defaultProps} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) when the X button is clicked', () => {
      const onOpenChange = vi.fn();
      render(<CreateBatchModal {...defaultProps} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByLabelText(/close/i));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  /* ─────────────────────────────────────── Form reset on close ── */
  describe('Form reset on close', () => {
    it('resets Name of Batch input after closing via Cancel', async () => {
      render(<ControlledModal />);

      // open
      fireEvent.click(screen.getByText('Open Modal'));
      fireEvent.change(screen.getByPlaceholderText('Enter batch name'), {
        target: { value: 'Temporary Batch' },
      });
      expect(screen.getByPlaceholderText('Enter batch name')).toHaveValue('Temporary Batch');

      // close
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // reopen — value should be cleared
      fireEvent.click(screen.getByText('Open Modal'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter batch name')).toHaveValue('');
      });
    });

    it('resets Issue Certificate switch to OFF after closing', async () => {
      render(<ControlledModal />);

      fireEvent.click(screen.getByText('Open Modal'));
      const sw = screen.getByRole('switch', { name: /issue certificate/i });
      fireEvent.click(sw); // turn ON
      expect(sw).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      fireEvent.click(screen.getByText('Open Modal'));
      await waitFor(() => {
        expect(
          screen.getByRole('switch', { name: /issue certificate/i })
        ).toHaveAttribute('aria-checked', 'false');
      });
    });
  });

  /* ─────────────────────────────────────── Mentor search ── */
  describe('Mentor search', () => {
    it('does not call fuzzy search when query is shorter than 2 chars', () => {
      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText(/search mentors/i), {
        target: { value: 'a' },
      });
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls fuzzy search and shows results when >= 2 chars are typed', async () => {
      mockMutateAsync.mockResolvedValue({
        data: {
          response: {
            content: [
              { identifier: 'u1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
            ],
          },
        },
      });

      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText(/search mentors/i), {
        target: { value: 'Ali' },
      });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          identifier: 'Ali',
          name: 'Ali',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });
    });

    it('shows "No users found" when search returns empty results', async () => {
      mockMutateAsync.mockResolvedValue({
        data: { response: { content: [] } },
      });

      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText(/search mentors/i), {
        target: { value: 'xyz' },
      });

      await waitFor(() => {
        expect(screen.getByText(/no users found for/i)).toBeInTheDocument();
      });
    });

    it('selecting a mentor result shows a tag chip', async () => {
      mockMutateAsync.mockResolvedValue({
        data: {
          response: {
            content: [
              { identifier: 'u2', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
            ],
          },
        },
      });

      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText(/search mentors/i), {
        target: { value: 'Bob' },
      });

      await waitFor(() => screen.getByText('Bob Jones'));
      const mentorCheckbox = screen.getAllByRole('checkbox').find(
        (el) => el.closest('label')?.textContent?.includes('Bob Jones')
      );
      fireEvent.click(mentorCheckbox!);

      // Tag chip should appear
      await waitFor(() => {
        const chips = screen.getAllByText('Bob Jones');
        expect(chips.length).toBeGreaterThan(0);
      });
    });
  });
});
