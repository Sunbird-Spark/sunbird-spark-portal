import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearnerBottomCards } from './LearnerBottomCards';

const mockToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));
vi.mock('@/hooks/useAppI18n', () => ({ useAppI18n: () => ({ t: (k: string) => k }) }));

const mockUpdateConsent = vi.fn();
vi.mock('@/hooks/useConsent', () => ({
  useConsent: () => ({ status: 'ACTIVE', lastUpdatedOn: '2026-01-01', updateConsent: mockUpdateConsent, isUpdating: false }),
}));

vi.mock('@/components/collection/AvailableBatchesCard', () => ({
  default: ({ onJoinCourse }: any) => <button data-testid="join-btn" onClick={onJoinCourse}>Join</button>,
}));
vi.mock('@/components/collection/CertificateCard', () => ({
  default: () => <div data-testid="cert-card" />,
}));
vi.mock('@/components/collection/ProfileDataSharingCard', () => ({
  default: ({ onAgree, onDisagree }: any) => (
    <div data-testid="sharing-card">
      <button data-testid="agree-btn" onClick={onAgree}>Agree</button>
      <button data-testid="disagree-btn" onClick={onDisagree}>Disagree</button>
    </div>
  ),
}));

const defaultProps = {
  hasBatchInRoute: false,
  showCertificateCard: false,
  batches: [],
  selectedBatchId: 'batch-1',
  setSelectedBatchId: vi.fn(),
  onJoinCourse: vi.fn(),
  batchListLoading: false,
  joinLoading: false,
  batchListError: null,
  joinError: null,
  hasCertificate: false,
  firstCertPreviewUrl: undefined,
  onCertificatePreviewClick: vi.fn(),
  showProfileDataSharingCard: false,
  collectionId: 'coll-1',
  channel: 'channel-1',
  userProfile: undefined,
};

describe('LearnerBottomCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateConsent.mockResolvedValue(undefined);
  });

  it('renders AvailableBatchesCard when hasBatchInRoute is false', () => {
    render(<LearnerBottomCards {...defaultProps} />);
    expect(screen.getByTestId('join-btn')).toBeInTheDocument();
  });

  it('does not render AvailableBatchesCard when hasBatchInRoute is true', () => {
    render(<LearnerBottomCards {...defaultProps} hasBatchInRoute />);
    expect(screen.queryByTestId('join-btn')).not.toBeInTheDocument();
  });

  it('renders CertificateCard when showCertificateCard is true', () => {
    render(<LearnerBottomCards {...defaultProps} showCertificateCard />);
    expect(screen.getByTestId('cert-card')).toBeInTheDocument();
  });

  it('does not render CertificateCard when showCertificateCard is false', () => {
    render(<LearnerBottomCards {...defaultProps} showCertificateCard={false} />);
    expect(screen.queryByTestId('cert-card')).not.toBeInTheDocument();
  });

  it('renders ProfileDataSharingCard when showProfileDataSharingCard is true', () => {
    render(<LearnerBottomCards {...defaultProps} showProfileDataSharingCard />);
    expect(screen.getByTestId('sharing-card')).toBeInTheDocument();
  });

  it('calls onJoinCourse with selectedBatchId when Join is clicked', () => {
    const onJoinCourse = vi.fn();
    render(<LearnerBottomCards {...defaultProps} onJoinCourse={onJoinCourse} selectedBatchId="batch-42" />);
    fireEvent.click(screen.getByTestId('join-btn'));
    expect(onJoinCourse).toHaveBeenCalledWith('batch-42');
  });

  it('handleConsentAgree: calls updateConsent("ACTIVE") and shows success toast', async () => {
    mockUpdateConsent.mockResolvedValue(undefined);
    render(<LearnerBottomCards {...defaultProps} showProfileDataSharingCard />);
    fireEvent.click(screen.getByTestId('agree-btn'));
    await vi.waitFor(() => {
      expect(mockUpdateConsent).toHaveBeenCalledWith('ACTIVE');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
    });
  });

  it('handleConsentAgree: shows destructive toast on error', async () => {
    mockUpdateConsent.mockRejectedValue(new Error('Update failed'));
    render(<LearnerBottomCards {...defaultProps} showProfileDataSharingCard />);
    fireEvent.click(screen.getByTestId('agree-btn'));
    await vi.waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    });
  });

  it('handleConsentDisagree: calls updateConsent("REVOKED") and shows success toast', async () => {
    mockUpdateConsent.mockResolvedValue(undefined);
    render(<LearnerBottomCards {...defaultProps} showProfileDataSharingCard />);
    fireEvent.click(screen.getByTestId('disagree-btn'));
    await vi.waitFor(() => {
      expect(mockUpdateConsent).toHaveBeenCalledWith('REVOKED');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
    });
  });

  it('handleConsentDisagree: shows destructive toast on error', async () => {
    mockUpdateConsent.mockRejectedValue(new Error('Update failed'));
    render(<LearnerBottomCards {...defaultProps} showProfileDataSharingCard />);
    fireEvent.click(screen.getByTestId('disagree-btn'));
    await vi.waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    });
  });
});
