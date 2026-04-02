import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BatchCard from './BatchCard';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, data?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'batchTabs.ongoing': 'Ongoing',
        'batchTabs.upcoming': 'Upcoming',
        'batchTabs.expired': 'Expired',
        'batchRow.editBatch': 'Edit batch',
        'certificate.certificateLocked': 'Certificate Locked',
        'certificate.certificateUnavailable': 'Certificate Unavailable',
        'certificate.editCertificate': 'Edit Certificate',
        'certificate.addCertificate': 'Add Certificate',
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

vi.mock('./CreateBatchModal', () => ({
  default: ({ open, onOpenChange, collectionId }: any) =>
    open ? (
      <div data-testid="create-batch-modal" data-collection-id={collectionId}>
        <button type="button" onClick={() => onOpenChange(false)}>Close Modal</button>
      </div>
    ) : null,
}));

vi.mock('./AddCertificateModal', () => ({
  default: ({ open, onOpenChange, courseId, batchId }: any) =>
    open ? (
      <div data-testid="add-certificate-modal" data-course-id={courseId} data-batch-id={batchId}>
        <button type="button" onClick={() => onOpenChange(false)}>Close Certificate Modal</button>
      </div>
    ) : null,
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'creator', id: 'user-1' } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: () => ({ data: null, isSuccess: false }),
}));

vi.mock('@/hooks/useTnc', () => ({
  useAcceptTnc: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGetTncUrl: () => ({ data: null }),
}));

const mockUseBatchList = vi.fn();
const mockUseBatchListForMentor = vi.fn();

vi.mock('@/hooks/useBatch', () => ({
  useBatchListForCreator: (courseId: string, options?: any) => mockUseBatchList(courseId, options),
  useBatchListForMentor: (courseId: string, options?: any) => mockUseBatchListForMentor(courseId, options),
  mergeBatches: (a: any, b: any) => {
    const combined = [...(a || []), ...(b || [])];
    return combined.filter((v, i, arr) => arr.findIndex(t => t.id === v.id) === i);
  },
}));

vi.mock('@/hooks/useUser', () => ({
  useIsContentCreator: () => true,
  useIsMentor: () => false,
}));

vi.mock('@/hooks/useInteract', () => ({
  default: () => ({ interact: vi.fn() }),
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermissions: () => ({
    roles: ['PUBLIC'],
    isLoading: false,
    isAuthenticated: false,
    error: null,
    hasAnyRole: vi.fn(() => false),
    canAccessFeature: vi.fn(() => false),
    refetch: vi.fn(),
  }),
}));

const mockRefetch = vi.fn();

describe('BatchCard - Modals', () => {
  const defaultProps = { collectionId: 'test-collection-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBatchList.mockReturnValue({
      data: [], isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    mockUseBatchListForMentor.mockReturnValue({
      data: [], isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
  });

  /* ── Modal closed by default ── */
  it('does not show the modal on initial render', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByTestId('create-batch-modal')).not.toBeInTheDocument();
  });

  /* ── Opening the modal ── */
  it('opens the modal when Create Batch button is clicked', () => {
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    expect(screen.getAllByTestId('create-batch-modal').length).toBeGreaterThan(0);
  });

  /* ── Closing the modal ── */
  it('closes the modal when onOpenChange(false) is called by modal', () => {
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    const closeButtons = screen.getAllByText('Close Modal');
    if (closeButtons.length > 0 && closeButtons[0]) {
      fireEvent.click(closeButtons[0]);
    }
    expect(screen.queryByTestId('create-batch-modal')).not.toBeInTheDocument();
  });

  /* ── Props forwarding ── */
  it('passes the correct collectionId to the modal', () => {
    render(<BatchCard collectionId="collection-abc" />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    const modals = screen.getAllByTestId('create-batch-modal');
    expect(modals[0]).toHaveAttribute('data-collection-id', 'collection-abc');
  });

  /* ── Certificate modal ── */
  it('does not show the certificate modal on initial render', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByTestId('add-certificate-modal')).not.toBeInTheDocument();
  });

  it('opens the certificate modal when certificate button is clicked', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Test Batch', status: '1', startDate: '2026-05-01', endDate: '2026-08-01' }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add certificate/i }));
    expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();
  });

  it('passes the correct courseId and batchId to the certificate modal', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'batch-xyz', name: 'Test Batch', status: '1', startDate: '2026-05-01', endDate: '2026-08-01' }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard collectionId="collection-abc" />);
    fireEvent.click(screen.getByRole('button', { name: /add certificate/i }));
    const modal = screen.getByTestId('add-certificate-modal');
    expect(modal).toHaveAttribute('data-course-id', 'collection-abc');
    expect(modal).toHaveAttribute('data-batch-id', 'batch-xyz');
  });

  it('closes the certificate modal when onOpenChange(false) is called', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Test Batch', status: '1', startDate: '2026-05-01', endDate: '2026-08-01' }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add certificate/i }));
    fireEvent.click(screen.getByText('Close Certificate Modal'));
    expect(screen.queryByTestId('add-certificate-modal')).not.toBeInTheDocument();
  });

  it('passes collectionName to the certificate modal', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Test Batch', status: '1', startDate: '2026-05-01', endDate: '2026-08-01' }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard collectionId="collection-abc" collectionName="Test Collection" />);
    fireEvent.click(screen.getByRole('button', { name: /add certificate/i }));
    expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();
  });

  it('passes existing cert templates to the certificate modal', () => {
    mockUseBatchList.mockReturnValue({
      data: [{
        id: 'b1', name: 'Test Batch', status: '1', startDate: '2026-05-01', endDate: '2026-08-01',
        certTemplates: { 'template-1': { name: 'Template 1' } },
      }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /edit certificate/i }));
    expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();
  });

  /* ── Edit batch modal ── */
  it('opens the edit modal when edit button is clicked on a batch', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Test Batch', status: '1', startDate: '2026-05-01', endDate: '2026-08-01' }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /edit batch/i }));
    expect(screen.getByTestId('create-batch-modal')).toBeInTheDocument();
  });

  it('closes the edit modal when onOpenChange(false) is called', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Test Batch', status: '1', startDate: '2026-05-01', endDate: '2026-08-01' }],
      isLoading: false, isError: false, refetch: mockRefetch, isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /edit batch/i }));
    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('create-batch-modal')).not.toBeInTheDocument();
  });
});
