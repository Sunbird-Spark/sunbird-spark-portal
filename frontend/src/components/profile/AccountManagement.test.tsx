import { render, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AccountManagement from './AccountManagement';

const mockUseUserRoles = vi.fn();

vi.mock('@/hooks/useUser', () => ({
  useUserRoles: () => mockUseUserRoles(),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

const renderCard = () =>
  render(
    <MemoryRouter>
      <AccountManagement />
    </MemoryRouter>,
  );

describe('AccountManagement', () => {
  beforeEach(() => {
    mockUseUserRoles.mockReset();
  });

  it('renders nothing while roles are loading (prevents flash)', () => {
    mockUseUserRoles.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderCard();
    expect(container.firstChild).toBeNull();
  });

  it('hides the card when the user is an ORG_ADMIN', () => {
    mockUseUserRoles.mockReturnValue({
      data: [{ role: 'ORG_ADMIN' }, { role: 'PUBLIC' }],
      isLoading: false,
    });
    const { container } = renderCard();
    expect(container.firstChild).toBeNull();
  });

  it('renders the delete-account CTA for non-admin users', () => {
    mockUseUserRoles.mockReturnValue({
      data: [{ role: 'PUBLIC' }, { role: 'CONTENT_CREATOR' }],
      isLoading: false,
    });
    renderCard();
    const link = screen.getByRole('link', { name: /accountManagement.deleteCta/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/profile/delete');
    expect(link).toHaveAttribute('data-edataid', 'profile-delete-account-link');
  });

  it('renders for an empty-roles user', () => {
    mockUseUserRoles.mockReturnValue({ data: [], isLoading: false });
    renderCard();
    expect(screen.getByText('accountManagement.title')).toBeInTheDocument();
  });
});
