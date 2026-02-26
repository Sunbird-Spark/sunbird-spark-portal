import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CertificatesTab from './CertificatesTab';
import { useCertUserSearch, useReissueCert } from '@/hooks/useCourseDashboard';

vi.mock('@/hooks/useCourseDashboard', () => ({
  useCertUserSearch: vi.fn(),
  useReissueCert: vi.fn(),
}));

describe('CertificatesTab', () => {
  const mockSearchUser = vi.fn();
  const mockResetSearch = vi.fn();
  const mockReissueCert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCertUserSearch as any).mockReturnValue({
      mutate: mockSearchUser,
      data: undefined,
      isPending: false,
      error: null,
      reset: mockResetSearch,
    });
    (useReissueCert as any).mockReturnValue({
      mutate: mockReissueCert,
      isPending: false,
    });
  });

  it('renders search form and hint toggle', () => {
    render(<CertificatesTab collectionId="col_123" />);
    expect(screen.getByTestId('unique-id-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-btn')).toBeDisabled();
    expect(screen.getByTestId('hint-toggle')).toBeInTheDocument();
  });

  it('toggles hint window', () => {
    render(<CertificatesTab collectionId="col_123" />);
    expect(screen.queryByTestId('hint-box')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('hint-toggle'));
    expect(screen.getByTestId('hint-box')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('hint-toggle'));
    expect(screen.queryByTestId('hint-box')).not.toBeInTheDocument();
  });

  it('calls search endpoint on valid submit', () => {
    render(<CertificatesTab collectionId="col_123" />);
    const input = screen.getByTestId('unique-id-input');
    const form = screen.getByTestId('cert-search-form');

    fireEvent.change(input, { target: { value: 'user-123' } });
    expect(screen.getByTestId('search-btn')).not.toBeDisabled();

    fireEvent.submit(form);
    expect(mockResetSearch).toHaveBeenCalled();
    expect(mockSearchUser).toHaveBeenCalledWith({ userName: 'user-123', courseId: 'col_123' });
  });

  it('renders no result when search returns null batches', () => {
    (useCertUserSearch as any).mockReturnValue({
      mutate: mockSearchUser,
      data: { data: { response: { userName: 'user-123', courses: { batches: [] } } } },
      isPending: false,
      error: null,
      reset: mockResetSearch,
    });

    render(<CertificatesTab collectionId="col_123" />);
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  it('renders table and handles reissue flow', async () => {
    const mockResult = {
      data: {
        response: {
          userId: 'u1',
          userName: 'User One',
          courses: {
            batches: [
              { batchId: 'b1', name: 'Batch 1', completionPercentage: 100, status: 2, issuedCertificates: [{ name: 'Cert A' }] },
            ],
          },
        },
      }
    };

    (useCertUserSearch as any).mockReturnValue({
      mutate: mockSearchUser,
      data: mockResult,
      isPending: false,
      error: null,
      reset: mockResetSearch,
    });

    render(<CertificatesTab collectionId="col_123" />);
    
    expect(screen.getByTestId('results-table-wrapper')).toBeInTheDocument();
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('Batch 1')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();

    // Click reissue
    fireEvent.click(screen.getByTestId('reissue-btn-0'));
    expect(screen.getByTestId('reissue-modal')).toBeInTheDocument();
    expect(screen.getByTestId('reissue-modal')).toHaveTextContent(/User One/);
    expect(screen.getByTestId('reissue-modal')).toHaveTextContent(/Batch 1/);

    // Confirm reissue
    fireEvent.click(screen.getByTestId('modal-yes-btn'));

    // Check that reissue mutation was called
    expect(mockReissueCert).toHaveBeenCalledWith(
      { courseId: 'col_123', batchId: 'b1', userIds: ['u1'] },
      expect.any(Object)
    );

    // Simulate success callback
    const successCallback = mockReissueCert.mock.calls[0]![1]?.onSuccess;
    if (successCallback) {
      act(() => {
        successCallback();
      });
    }

    await waitFor(() => {
      expect(screen.queryByTestId('reissue-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('reissue-status')).toHaveTextContent('Certificate re-issued successfully.');
    });
  });

  it('shows Criteria Met as "No" if status is not 2, even if certificates exist', () => {
    const mockResult = {
      data: {
        response: {
          userId: 'u1',
          userName: 'User One',
          courses: {
            batches: [
              { batchId: 'b1', name: 'Batch 1', completionPercentage: 100, status: 1, issuedCertificates: [{ name: 'Cert A' }] },
            ],
          },
        },
      }
    };

    (useCertUserSearch as any).mockReturnValue({
      mutate: vi.fn(),
      data: mockResult,
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    render(<CertificatesTab collectionId="col_123" />);
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByTestId('reissue-btn-0')).toBeDisabled();
    expect(screen.getByTestId('reissue-btn-0')).toHaveAttribute('title', 'Criteria must be met to re-issue');
  });

  it('shows Criteria Met as "Yes" if status is 2, even if no certificates exist', () => {
    const mockResult = {
      data: {
        response: {
          userId: 'u1',
          userName: 'User One',
          courses: {
            batches: [
              { batchId: 'b1', name: 'Batch 1', completionPercentage: 100, status: 2, issuedCertificates: [] },
            ],
          },
        },
      }
    };

    (useCertUserSearch as any).mockReturnValue({
      mutate: vi.fn(),
      data: mockResult,
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    render(<CertificatesTab collectionId="col_123" />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByTestId('reissue-btn-0')).not.toBeDisabled();
  });
});
