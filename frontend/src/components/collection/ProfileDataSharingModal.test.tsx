import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileDataSharingModal from './ProfileDataSharingModal';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (children: ReactNode) => children,
  };
});

vi.mock('@/components/common/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    'aria-label'?: string;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

describe('ProfileDataSharingModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    userProfile: { firstName: 'Test', lastName: 'User', id: 'user-1', email: 'test@example.com', phone: '9876543210' },
    onAgree: vi.fn().mockResolvedValue(undefined),
    onDisagree: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
  };

  it('returns null when open is false', () => {
    const { container } = render(
      <ProfileDataSharingModal {...defaultProps} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when open is true', () => {
    render(<ProfileDataSharingModal {...defaultProps} />);
    expect(screen.getByRole('dialog', { name: 'profileDataSharing.consentTitle' })).toBeInTheDocument();
    expect(screen.getByText('profileDataSharing.consentTitle')).toBeInTheDocument();
  });

  it('displays profile fields from userProfile', () => {
    render(<ProfileDataSharingModal {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
  });

  it('shows dash for missing profile fields', () => {
    render(
      <ProfileDataSharingModal
        {...defaultProps}
        userProfile={{}}
      />
    );
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ProfileDataSharingModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<ProfileDataSharingModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Share button is disabled until checkbox is checked', () => {
    render(<ProfileDataSharingModal {...defaultProps} />);
    const shareBtn = screen.getByRole('button', { name: 'profileDataSharing.share' });
    expect(shareBtn).toHaveAttribute('disabled');
    fireEvent.click(screen.getByRole('checkbox', { name: 'profileDataSharing.tncCheckboxLabel' }));
    expect(shareBtn).not.toHaveAttribute('disabled');
  });

  it('calls onAgree and onClose when Share is clicked after agreeing to T&C', async () => {
    const onAgree = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ProfileDataSharingModal {...defaultProps} onAgree={onAgree} onClose={onClose} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'profileDataSharing.tncCheckboxLabel' }));
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.share' }));
    await waitFor(() => {
      expect(onAgree).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDisagree and onClose when Don\'t Share is clicked', async () => {
    const onDisagree = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ProfileDataSharingModal {...defaultProps} onDisagree={onDisagree} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'profileDataSharing.dontShare' }));
    await waitFor(() => {
      expect(onDisagree).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Don\'t Share button is disabled when isSubmitting is true', () => {
    render(<ProfileDataSharingModal {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: 'profileDataSharing.dontShare' })).toHaveAttribute('disabled');
  });

  it('uses declarations to override email and phone when present', () => {
    render(
      <ProfileDataSharingModal
        {...defaultProps}
        userProfile={{
          firstName: 'A',
          lastName: 'B',
          id: 'id1',
          email: 'original@x.com',
          phone: '111',
          declarations: [
            {
              info: {
                'declared-email': 'declared@y.com',
                'declared-phone': '999',
              },
            },
          ],
        }}
      />
    );
    expect(screen.getByText('declared@y.com')).toBeInTheDocument();
    expect(screen.getByText('999')).toBeInTheDocument();
  });
});
