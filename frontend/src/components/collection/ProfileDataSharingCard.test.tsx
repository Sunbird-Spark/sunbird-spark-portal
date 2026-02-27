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
    userProfile,
  }: {
    open: boolean;
    onClose: () => void;
    onAgree: () => Promise<void>;
    onDisagree: () => Promise<void>;
    userProfile: Record<string, unknown> | null | undefined;
  }) =>
    open ? (
      <div data-testid="profile-data-sharing-modal" role="dialog">
        <button type="button" onClick={onClose} aria-label="close-modal">
          Close
        </button>
        <button type="button" onClick={() => onAgree()} data-testid="modal-agree">
          Share
        </button>
        <button type="button" onClick={() => onDisagree()} data-testid="modal-disagree">
          Don't Share
        </button>
        <span data-testid="modal-user-profile">{userProfile ? 'has-profile' : 'no-profile'}</span>
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

  it('renders card with test id', () => {
    render(<ProfileDataSharingCard {...defaultProps} />);
    expect(screen.getByTestId('profile-data-sharing-card')).toBeInTheDocument();
  });

  it('shows status Off when status is not ACTIVE', () => {
    render(<ProfileDataSharingCard {...defaultProps} status={null} />);
    expect(screen.getByText('profileDataSharing.cardTitle')).toBeInTheDocument();
    expect(screen.getByText('profileDataSharing.statusOff')).toBeInTheDocument();
  });

  it('shows status On when status is ACTIVE', () => {
    render(<ProfileDataSharingCard {...defaultProps} status="ACTIVE" />);
    expect(screen.getByText('profileDataSharing.statusOn')).toBeInTheDocument();
  });

  it('shows last updated date when lastUpdatedOn is provided', () => {
    render(
      <ProfileDataSharingCard
        {...defaultProps}
        lastUpdatedOn="2026-02-26T10:00:00.000Z"
      />
    );
    expect(screen.getByText(/profileDataSharing\.lastUpdatedOn/)).toBeInTheDocument();
    expect(screen.getByText(/26\/02\/2026/)).toBeInTheDocument();
  });

  it('does not show last updated when lastUpdatedOn is undefined', () => {
    render(<ProfileDataSharingCard {...defaultProps} lastUpdatedOn={undefined} />);
    expect(screen.queryByText(/26\/02\/2026/)).not.toBeInTheDocument();
  });

  it('does not open modal by default', () => {
    render(<ProfileDataSharingCard {...defaultProps} status={null} />);
    expect(screen.queryByTestId('profile-data-sharing-modal')).not.toBeInTheDocument();
  });

  it('opens modal when Update button is clicked', () => {
    render(<ProfileDataSharingCard {...defaultProps} />);
    expect(screen.queryByTestId('profile-data-sharing-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.update' }));
    expect(screen.getByTestId('profile-data-sharing-modal')).toBeInTheDocument();
  });

  it('closes modal when modal close is triggered', () => {
    render(<ProfileDataSharingCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.update' }));
    expect(screen.getByTestId('profile-data-sharing-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close-modal' }));
    expect(screen.queryByTestId('profile-data-sharing-modal')).not.toBeInTheDocument();
  });

  it('passes userProfile to modal when provided', () => {
    const userProfile = { firstName: 'Test', lastName: 'User', id: 'u1' };
    render(
      <ProfileDataSharingCard {...defaultProps} userProfile={userProfile} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.update' }));
    expect(screen.getByTestId('modal-user-profile')).toHaveTextContent('has-profile');
  });
});
