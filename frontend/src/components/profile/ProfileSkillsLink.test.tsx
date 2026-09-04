import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfileSkillsLink from './ProfileSkillsLink';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

describe('ProfileSkillsLink', () => {
  it('renders the card title and links to the My Skills page', () => {
    render(
      <MemoryRouter>
        <ProfileSkillsLink />
      </MemoryRouter>
    );

    expect(screen.getByText('profileSkills.cardTitle')).toBeInTheDocument();
    expect(screen.getByTestId('profile-skills-link')).toHaveAttribute('href', '/profile/skills');
  });
});
