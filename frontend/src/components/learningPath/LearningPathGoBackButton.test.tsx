import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LearningPathGoBackButton } from './LearningPathGoBackButton';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderWithState(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/learning-path/do_lp', state }]}>
      <LearningPathGoBackButton />
    </MemoryRouter>
  );
}

describe('LearningPathGoBackButton', () => {
  it('renders the go-back label', () => {
    renderWithState();
    expect(screen.getByText('button.goBack')).toBeInTheDocument();
  });

  it('navigates to location.state.from on click', () => {
    renderWithState({ from: '/my-learning' });
    fireEvent.click(screen.getByText('button.goBack'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-learning');
  });

  it('falls back to /explore when there is no state.from', () => {
    renderWithState();
    fireEvent.click(screen.getByText('button.goBack'));
    expect(mockNavigate).toHaveBeenCalledWith('/explore');
  });
});
