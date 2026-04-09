import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchCard from './BatchCard';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/' })),
  };
});

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, data?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'batchTabs.ongoing': 'Ongoing',
        'batchTabs.upcoming': 'Upcoming',
        'batchTabs.expired': 'Expired',
        'batchRow.editBatch': 'Edit batch',
        'batchRow.batchCannotBeEdited': 'Batch cannot be edited after the start date has passed',
        'batchRow.certificateCannotBeModified': 'Certificate cannot be modified after the batch end date',
        'batchRow.enrolmentEnds': 'Enrolment ends {{date}}',
        'certificate.certificateLocked': 'Certificate Locked',
        'certificate.certificateUnavailable': 'Certificate Unavailable',
        'certificate.editCertificate': 'Edit Certificate',
        'certificate.addCertificate': 'Add Certificate',
        'batch.manageBatches': 'Manage batches for this course',
        'batch.failedToLoadBatches': 'Failed to load batches.',
        'batch.noTabBatches': 'No {{tab}} batches',
        'batch.termsAccepted': 'Terms accepted',
        'batch.canViewBatchReports': 'You can now view batch reports.',
        'batch.failedToAcceptTerms': 'Failed to accept Terms',
        'batch.pleaseRetry': 'Please try again.',
        'batch.toViewBatchReports': 'to view batch reports.',
        'tncCheckbox.termsLink': 'Terms & Conditions',
        'tncCheckbox.forCreatingBatch': 'for creating this batch.',
      };
      let result = translations[key] || key;
      if (data) {
        Object.entries(data).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
  }),
}));

// Isolate BatchCard from CreateBatchModal so we test only the card behaviour
vi.mock('./CreateBatchModal', () => ({
  default: ({
    open,
    onOpenChange,
    collectionId,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    collectionId: string;
  }) =>
    open ? (
      <div data-testid="create-batch-modal" data-collection-id={collectionId}>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close Modal
        </button>
      </div>
    ) : null,
}));

// Mock AddCertificateModal
vi.mock('./AddCertificateModal', () => ({
  default: ({
    open,
    onOpenChange,
    courseId,
    batchId,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: string;
    batchId: string;
  }) =>
    open ? (
      <div data-testid="add-certificate-modal" data-course-id={courseId} data-batch-id={batchId}>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close Certificate Modal
        </button>
      </div>
    ) : null,
}));

const mockUseAuth = vi.fn(() => ({ user: { role: 'creator', id: 'user-1' } }));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockUseSystemSetting = vi.fn(() => ({ data: null as any, isSuccess: false }));
vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => mockUseSystemSetting(),
}));

const mockAcceptTncMutateAsync = vi.fn();
const mockUseAcceptTnc = vi.fn(() => ({ mutateAsync: mockAcceptTncMutateAsync, isPending: false }));
vi.mock('@/hooks/useTnc', () => ({
  useAcceptTnc: () => mockUseAcceptTnc(),
  useGetTncUrl: () => ({ data: null }),
}));

const mockUseBatchList = vi.fn();
const mockUseBatchListForMentor = vi.fn();
const mockUseIsContentCreator = vi.fn();
const mockUseIsMentor = vi.fn();

vi.mock('@/hooks/useBatch', () => ({
  useBatchListForCreator: (courseId: string, options?: any) => mockUseBatchList(courseId, options),
  useBatchListForMentor: (courseId: string, options?: any) => mockUseBatchListForMentor(courseId, options),
  mergeBatches: (a: any, b: any) => {
    const combined = [...(a || []), ...(b || [])];
    return combined.filter((v, i, arr) => arr.findIndex(t => t.id === v.id) === i);
  },
}));

vi.mock('@/hooks/useUser', () => ({
  useIsContentCreator: () => mockUseIsContentCreator(),
  useIsMentor: () => mockUseIsMentor(),
}));

const mockHasAnyRole = vi.fn((_roles: string[]) => false);
vi.mock('@/hooks/usePermission', () => ({
  usePermissions: () => ({
    roles: ['PUBLIC'],
    isLoading: false,
    isAuthenticated: false,
    error: null,
    hasAnyRole: mockHasAnyRole,
    canAccessFeature: vi.fn(() => false),
    refetch: vi.fn(),
  }),
}));

const mockRefetch = vi.fn();

/** Default hook state — no batches, not loading */
const defaultHookState = { data: [], isLoading: false, isError: false, refetch: mockRefetch, isFetching: false };

describe('BatchCard', () => {
  const defaultProps = { collectionId: 'test-collection-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBatchList.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    mockUseBatchListForMentor.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });

    // We import these hooks at the top already, so we can mock them here if needed.
    // However, the test file uses `mockUseBatchList` directly. We need to tell the vi.mock
    // to actually map useBatchListForCreator to mockUseBatchList and mergeBatches.

    mockUseIsContentCreator.mockReturnValue(true); // Default to creator
    mockUseIsMentor.mockReturnValue(false); // Default to not mentor
    mockHasAnyRole.mockReturnValue(false);
    mockAcceptTncMutateAsync.mockResolvedValue(undefined);
    mockUseSystemSetting.mockReturnValue({ data: null, isSuccess: false });
    mockUseAcceptTnc.mockReturnValue({ mutateAsync: mockAcceptTncMutateAsync, isPending: false });
  });

  /* ── Rendering ── */

  it('renders the descriptive subtitle', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Manage batches for this course')).toBeInTheDocument();
  });

  it('renders the Create Batch button', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /create batch/i })).toBeInTheDocument();
  });

  it('Create Batch button has type="button" (not submit)', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /create batch/i })).toHaveAttribute('type', 'button');
  });

  it('calls useBatchList with the collectionId', () => {
    render(<BatchCard collectionId="col-abc" />);
    expect(mockUseBatchList).toHaveBeenCalledWith('col-abc', { enabled: true });
  });

  /* ── Empty state ── */

  it('shows "No ongoing batches" when there are no batches in the selected tab', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('No Ongoing batches')).toBeInTheDocument();
  });

  /* ── Loading state ── */

  it('shows a loading spinner when isLoading is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: mockRefetch, isFetching: false });
    render(<BatchCard {...defaultProps} />);
    // Spinner is an SVG icon; the "No ongoing batches" text should NOT appear
    expect(screen.queryByText('No ongoing batches')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to load batches.')).not.toBeInTheDocument();
  });

  /* ── Error state ── */

  it('shows error message when isError is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: mockRefetch, isFetching: false });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Failed to load batches.')).toBeInTheDocument();
  });

  /* ── Batch list ── */

  it('renders a batch within the "Ongoing" tab correctly', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Ongoing Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-30' }],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Ongoing Batch')).toBeInTheDocument();
  });

  it('shows the batch details in Upcoming tab', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        { id: 'b2', name: 'Upcoming Batch', status: '0', startDate: '2026-07-01', endDate: '2026-09-30' },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);

    // Click upcoming tab
    const upcomingTab = screen.getByRole('button', { name: /Upcoming/i });
    fireEvent.click(upcomingTab);

    expect(screen.getByText('Upcoming Batch')).toBeInTheDocument();
  });

  it('shows "Edit Certificate" when certTemplates is non-empty', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Cert Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          certTemplates: { 'template-1': { name: 'Template One' } },
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /edit certificate/i })).toBeInTheDocument();
  });

  it('shows "Add Certificate" when certTemplates is absent', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'No Cert Batch', status: '1', startDate: '2026-01-01', endDate: '2026-06-01' }],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add certificate/i })).toBeInTheDocument();
  });

  it('shows enrolment end date when provided', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Enrol Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          enrollmentEndDate: '2026-03-15',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText(/enrolment ends/i)).toBeInTheDocument();
  });

  it('does NOT show "No ongoing batches" when batches are present', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Some Batch', status: '1', startDate: '', endDate: '' }],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByText('No ongoing batches')).not.toBeInTheDocument();
  });



  /* ── Tab filtering ── */

  it('filters batches by status tabs correctly', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        { id: 'b1', name: 'Ongoing Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-01' },
        { id: 'b2', name: 'Upcoming Batch', status: '0', startDate: '2026-07-01', endDate: '2026-09-01' },
        { id: 'b3', name: 'Expired Batch', status: '2', startDate: '2025-01-01', endDate: '2025-06-01' },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);

    expect(screen.getByText('Ongoing Batch')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming Batch')).not.toBeInTheDocument();
    expect(screen.queryByText('Expired Batch')).not.toBeInTheDocument();

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    expect(screen.queryByText('Ongoing Batch')).not.toBeInTheDocument();
    expect(screen.getByText('Upcoming Batch')).toBeInTheDocument();
    expect(screen.queryByText('Expired Batch')).not.toBeInTheDocument();

    const expiredTab = screen.getByRole('button', { name: /expired/i });
    fireEvent.click(expiredTab);

    expect(screen.queryByText('Ongoing Batch')).not.toBeInTheDocument();
    expect(screen.queryByText('Upcoming Batch')).not.toBeInTheDocument();
    expect(screen.getByText('Expired Batch')).toBeInTheDocument();
  });

  it('shows correct tab counts', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        { id: 'b1', name: 'Ongoing Batch 1', status: '1', startDate: '2026-03-01', endDate: '2026-06-01' },
        { id: 'b2', name: 'Ongoing Batch 2', status: '1', startDate: '2026-03-01', endDate: '2026-06-01' },
        { id: 'b3', name: 'Upcoming Batch', status: '0', startDate: '2026-07-01', endDate: '2026-09-01' },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);

    // Tabs should be rendered with counts
    expect(screen.getByRole('button', { name: /ongoing/i })).toBeInTheDocument();
  });

  /* ── Refresh button ── */

  it('renders the refresh button', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /refresh batch list/i })).toBeInTheDocument();
  });

  it('calls refetch when the refresh button is clicked', () => {
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /refresh batch list/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('disables the refresh button when isFetching is true', () => {
    mockUseBatchList.mockReturnValue({ ...defaultHookState, isFetching: true });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /refresh batch list/i })).toBeDisabled();
  });

  it('adds animate-spin class to the refresh icon when isFetching is true', () => {
    mockUseBatchList.mockReturnValue({ ...defaultHookState, isFetching: true });
    render(<BatchCard {...defaultProps} />);
    const refreshBtn = screen.getByRole('button', { name: /refresh batch list/i });
    const icon = refreshBtn.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });

  /* ── Role based TnC ── */

  it('does NOT show Reviewer TnC even if user has reviewer role but is also a creator', () => {
    mockUseAuth.mockReturnValueOnce({
      user: { role: 'content_reviewer', id: 'user-1' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    } as any);
    mockUseIsContentCreator.mockReturnValue(true);

    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByText(/to view batch reports/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Accept & Continue/i)).not.toBeInTheDocument();
  });

  /* ── Reviewer TnC error path (lines 50-59) ── */

  it('shows destructive toast when acceptTncMutation rejects', async () => {
    // Set up: user is a reviewer (not a creator) with TnC data loaded
    mockUseIsContentCreator.mockReturnValue(false);
    mockHasAnyRole.mockImplementation((roles: string[]) => roles.includes('CONTENT_REVIEWER'));
    const tncConfig = { version: '1.0', url: 'https://example.com/tnc' };
    mockUseSystemSetting.mockReturnValue({ data: tncConfig, isSuccess: true });
    mockAcceptTncMutateAsync.mockRejectedValue(new Error('Network error'));
    mockUseAcceptTnc.mockReturnValue({ mutateAsync: mockAcceptTncMutateAsync, isPending: false });

    render(<BatchCard {...defaultProps} />);

    // The TnC section should be visible
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const acceptBtn = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to accept Terms',
          variant: 'destructive',
        })
      );
    });
  });

  it('does NOT show destructive toast when acceptTncMutation resolves', async () => {
    // Set up: user is a reviewer with TnC data loaded
    mockUseIsContentCreator.mockReturnValue(false);
    mockHasAnyRole.mockImplementation((roles: string[]) => roles.includes('CONTENT_REVIEWER'));
    const tncConfig = { version: '1.0', url: 'https://example.com/tnc' };
    mockUseSystemSetting.mockReturnValue({ data: tncConfig, isSuccess: true });
    mockAcceptTncMutateAsync.mockResolvedValue(undefined);
    mockUseAcceptTnc.mockReturnValue({ mutateAsync: mockAcceptTncMutateAsync, isPending: false });

    render(<BatchCard {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const acceptBtn = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Terms accepted',
          variant: 'success',
        })
      );
    });
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' })
    );
  });

  /* ── AddCertificateModal onOpenChange(false) clears certBatch (line 142) ── */

  it('closes AddCertificateModal and clears certBatch when onOpenChange(false) is called', async () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Cert Batch', status: '1', startDate: '2026-01-01', endDate: '2026-06-01' }],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);

    // Click "Add Certificate" to open the modal (sets certBatch)
    const addCertBtn = screen.getByRole('button', { name: /add certificate/i });
    fireEvent.click(addCertBtn);

    // Modal should now be visible
    await waitFor(() => {
      expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();
    });

    // Click the close button inside the mock modal (calls onOpenChange(false))
    const closeModalBtn = screen.getByRole('button', { name: /close certificate modal/i });
    fireEvent.click(closeModalBtn);

    // Modal should be gone (certBatch is null)
    await waitFor(() => {
      expect(screen.queryByTestId('add-certificate-modal')).not.toBeInTheDocument();
    });
  });

  /* ── Mentor Specific Logic ── */

  it('hides Create batch button for mentor-only users', () => {
    mockUseIsContentCreator.mockReturnValue(false);
    mockUseIsMentor.mockReturnValue(true);
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /create batch/i })).not.toBeInTheDocument();
  });

  it('does not show certificate actions for mentor-only users', () => {
    mockUseIsContentCreator.mockReturnValue(false);
    mockUseIsMentor.mockReturnValue(true);
    mockUseBatchListForMentor.mockReturnValue({
      data: [{ id: 'b1', name: 'Mentor Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-30' }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /add certificate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit certificate/i })).not.toBeInTheDocument();
  });

  it('deduplicates merged batches correctly', () => {
    mockUseIsContentCreator.mockReturnValue(true);
    mockUseIsMentor.mockReturnValue(true);
    const mockBatch = { id: 'b1', name: 'Duplicate Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-30' };
    mockUseBatchList.mockReturnValue({
      data: [mockBatch],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    mockUseBatchListForMentor.mockReturnValue({
      data: [mockBatch],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });

    render(<BatchCard {...defaultProps} />);
    const batchElements = screen.getAllByText('Duplicate Batch');
    expect(batchElements).toHaveLength(1);
  });
});
