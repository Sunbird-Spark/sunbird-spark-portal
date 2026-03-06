import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateBatchModal from './CreateBatchModal';

vi.mock('@/hooks/useInteract', () => ({
  default: () => ({ interact: vi.fn() }),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'batch.nameOfBatch': 'Name of Batch',
        'batch.enterBatchName': 'Enter batch name',
        'batch.aboutBatch': 'About Batch',
        'batch.briefDescBatch': 'Brief description about this batch',
        'batch.startDate': 'Start Date',
        'batch.endDate': 'End Date',
        'batch.enrolmentEndDate': 'Enrolment End Date',
        'batch.mustBeAfterEnrolmentEnd': 'Must be on or after enrolment end date',
        'batch.betweenStartDate': 'Between start date',
        'batch.betweenStartAndEndDate': 'Between start & end date',
        'cancel': 'Cancel',
        'save': 'Save',
        'footer.terms': 'Terms and Conditions',
        'termsDialog.description': 'View and read the terms and conditions document',
        'close': 'Close',
      };
      return translations[key] || key;
    },
  }),
}));

/* ── Mock useMentorList ── */
const mockAllMentors = [
  { identifier: 'u1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
  { identifier: 'u2', firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
];
let mockMentorsLoading = false;
vi.mock('@/hooks/useMentor', () => ({
  useMentorList: () => ({
    data: mockAllMentors,
    isLoading: mockMentorsLoading,
  }),
}));

/* ── Mock useBatch ── */
const mockCreateBatchMutateAsync = vi.fn();
const mockUpdateBatchMutateAsync = vi.fn();
let mockCreateBatchIsPending = false;
vi.mock('@/hooks/useBatch', () => ({
  useCreateBatch: () => ({
    mutateAsync: mockCreateBatchMutateAsync,
    isPending: mockCreateBatchIsPending,
  }),
  useUpdateBatch: () => ({
    mutateAsync: mockUpdateBatchMutateAsync,
    isPending: mockCreateBatchIsPending,
  }),
}));

/* ── Mock useSystemSetting + useGetTncUrl ── */
vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => ({ data: { url: 'https://example.com/tnc' }, isSuccess: true }),
}));
vi.mock('@/hooks/useTnc', () => ({
  useGetTncUrl: () => ({ data: 'https://example.com/tnc' }),
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
    mockCreateBatchIsPending = false;
    mockMentorsLoading = false;
    // Default: batch creation resolves successfully
    mockCreateBatchMutateAsync.mockResolvedValue({ data: { batchId: 'new-batch-1' } });
    mockUpdateBatchMutateAsync.mockResolvedValue({ data: { batchId: 'edited-batch-1' } });
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

    it('renders End Date input (not required)', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const el = screen.getByLabelText(/^end date/i);
      expect(el).toBeInTheDocument();
      expect(el).not.toBeRequired();
    });

    it('renders Enrolment End Date input (not required)', () => {
      render(<CreateBatchModal {...defaultProps} />);
      const el = screen.getByLabelText(/enrolment end date/i);
      expect(el).toBeInTheDocument();
      expect(el).not.toBeRequired();
    });

    it('renders Issue Certificate switch', () => {
      render(<CreateBatchModal {...defaultProps} />);
      // Check the text that usually goes with it or proper label
      expect(screen.getByRole('switch', { name: /issue certificate/i })).toBeInTheDocument();
    });

    it('renders Terms & Conditions checkbox', () => {
      render(<CreateBatchModal {...defaultProps} />);
      // Look for the checkbox by its label "I accept the Terms & Conditions for creating this batch."
      // The label text is split across elements, so we use a more flexible search
      expect(screen.getByLabelText(/i accept the/i)).toBeInTheDocument();
      // "Terms & Conditions" text lives in a separate button element
      expect(screen.getByRole('button', { name: /terms & conditions/i })).toBeInTheDocument();
    });

    it('renders mentor search input', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(
        screen.getByPlaceholderText(/search mentors by name/i)
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
      fireEvent.change(screen.getByLabelText(/^end date/i), {
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
      fireEvent.change(screen.getByLabelText(/^end date/i), {
        target: { value: '2026-04-01' },
      });
      fireEvent.click(screen.getByLabelText(/i accept the/i)); // T&C

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
      fireEvent.change(screen.getByLabelText(/^end date/i), {
        target: { value: '2026-04-01' },
      });
      const cb = screen.getByLabelText(/i accept the/i);
      fireEvent.click(cb); // check
      fireEvent.click(cb); // uncheck

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
    it('renders all mentors initially', () => {
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('filters mentors locally when typed', async () => {
      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText(/search mentors/i), {
        target: { value: 'Ali' },
      });

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });

    it('shows empty results when search does not match', async () => {
      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText(/search mentors/i), {
        target: { value: 'xyz' },
      });

      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });

    it('selecting a mentor result shows a tag chip', async () => {
      render(<CreateBatchModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText(/search mentors/i), {
        target: { value: 'Bob' },
      });

      const mentorCheckbox = screen.getAllByRole('checkbox').find(
        (el) => el.closest('label')?.textContent?.includes('Bob Jones')
      );
      fireEvent.click(mentorCheckbox!);

      // Tag chip should appear. One is the list result, and the other is the chip.
      const chips = screen.getAllByText('Bob Jones');
      expect(chips.length).toBeGreaterThan(1);
    });
  });

  /* ─────────────────────────────────── Batch creation API ── */
  describe('Batch creation API', () => {
    /** Fill all required fields and submit */
    const fillAndSubmit = () => {
      fireEvent.change(screen.getByPlaceholderText('Enter batch name'), {
        target: { value: 'Test Batch' },
      });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: '2026-03-01' },
      });
      // Use exact "End Date" label — "Enrolment End Date" starts with "Enrolment"
      fireEvent.change(screen.getByLabelText(/^end date/i), {
        target: { value: '2026-06-30' },
      });
      const cb = screen.getByLabelText(/i accept the/i);
      fireEvent.click(cb);
      fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    };

    it('calls useCreateBatch.mutateAsync with correct fields on submit', async () => {
      render(<CreateBatchModal {...defaultProps} />);
      fillAndSubmit();

      await waitFor(() => {
        expect(mockCreateBatchMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: 'col-123',
            name: 'Test Batch',
            startDate: '2026-03-01',
            endDate: '2026-06-30',
            tandc: true,
          })
        );
      });
    });

    it('closes the modal on successful submission', async () => {
      const onOpenChange = vi.fn();
      render(
        <CreateBatchModal open={true} onOpenChange={onOpenChange} collectionId="col-123" />
      );
      fillAndSubmit();

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows error message when API call fails', async () => {
      mockCreateBatchMutateAsync.mockRejectedValue(new Error('Server error'));
      render(<CreateBatchModal {...defaultProps} />);
      fillAndSubmit();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error');
      });
    });

    it('shows "Creating…" text on submit button while isPending', () => {
      mockCreateBatchIsPending = true;
      render(<CreateBatchModal {...defaultProps} />);
      expect(screen.getByText('Creating…')).toBeInTheDocument();
    });

    it('submit button is disabled while isPending', () => {
      mockCreateBatchIsPending = true;
      render(<CreateBatchModal {...defaultProps} />);
      const btn = screen.getByRole('button', { name: /creating/i });
      expect(btn).toBeDisabled();
    });
  });
});
