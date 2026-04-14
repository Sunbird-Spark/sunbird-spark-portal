import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileDataSharingCard from './ProfileDataSharingCard';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./ProfileDataSharingModal', () => ({
  default: ({
    open,
    onClose,
    onAgree,
    onDisagree,
  }: {
    open: boolean;
    onClose: () => void;
    onAgree: () => Promise<void>;
    onDisagree: () => Promise<void>;
    userProfile: Record<string, unknown> | null | undefined;
  }) =>
    open ? (
      <div data-testid="sharing-modal">
        <button type="button" onClick={onAgree}>Agree</button>
        <button type="button" onClick={onDisagree}>Disagree</button>
        <button type="button" onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('ProfileDataSharingCard', () => {
  const defaultProps = {
    status: null as 'ACTIVE' | 'REVOKED' | null,
    lastUpdatedOn: undefined as string | undefined,
    onAgree: vi.fn().mockResolvedValue(undefined),
    onDisagree: vi.fn().mockResolvedValue(undefined),
    isUpdating: false,
    userProfile: null as Record<string, unknown> | null | undefined,
  };

  it("renders card with testid 'profile-data-sharing-card'", () => {
    render(<ProfileDataSharingCard {...defaultProps} />);
    expect(screen.getByTestId('profile-data-sharing-card')).toBeInTheDocument();
  });

  it('shows "profileDataSharing.statusOn" text when status is ACTIVE', () => {
    render(<ProfileDataSharingCard {...defaultProps} status="ACTIVE" />);
    expect(screen.getByText('profileDataSharing.statusOn')).toBeInTheDocument();
  });

  it('shows "profileDataSharing.statusOff" text when status is REVOKED', () => {
    render(<ProfileDataSharingCard {...defaultProps} status="REVOKED" />);
    expect(screen.getByText('profileDataSharing.statusOff')).toBeInTheDocument();
  });

  it('shows "profileDataSharing.statusOff" text when status is null', () => {
    render(<ProfileDataSharingCard {...defaultProps} status={null} />);
    expect(screen.getByText('profileDataSharing.statusOff')).toBeInTheDocument();
  });

  it('shows formatted last updated date "15/03/2026" when lastUpdatedOn="2026-03-15T10:30:00.000Z"', () => {
    render(
      <ProfileDataSharingCard
        {...defaultProps}
        lastUpdatedOn="2026-03-15T10:30:00.000Z"
      />
    );
    expect(screen.getByText(/15\/03\/2026/)).toBeInTheDocument();
  });

  it('does NOT show last updated span when lastUpdatedOn is undefined', () => {
    render(<ProfileDataSharingCard {...defaultProps} lastUpdatedOn={undefined} />);
    expect(screen.queryByText(/profileDataSharing\.lastUpdatedOn/)).not.toBeInTheDocument();
  });

  it('clicking "Update" button opens the modal', () => {
    render(<ProfileDataSharingCard {...defaultProps} />);
    expect(screen.queryByTestId('sharing-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.update' }));
    expect(screen.getByTestId('sharing-modal')).toBeInTheDocument();
  });

  it("modal closes when modal's onClose is triggered", () => {
    render(<ProfileDataSharingCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.update' }));
    expect(screen.getByTestId('sharing-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('sharing-modal')).not.toBeInTheDocument();
  });

  it("calls onAgree when modal's Agree button is clicked", () => {
    const onAgree = vi.fn().mockResolvedValue(undefined);
    render(<ProfileDataSharingCard {...defaultProps} onAgree={onAgree} />);
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agree' }));
    expect(onAgree).toHaveBeenCalledTimes(1);
  });

  it("calls onDisagree when modal's Disagree button is clicked", () => {
    const onDisagree = vi.fn().mockResolvedValue(undefined);
    render(<ProfileDataSharingCard {...defaultProps} onDisagree={onDisagree} />);
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disagree' }));
    expect(onDisagree).toHaveBeenCalledTimes(1);
  });
});
