import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SkillCard } from './SkillCard';
import type { SkillIndexEntry } from '@/services/learningPath/skillIndex';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));

function entry(overrides: Partial<SkillIndexEntry> = {}): SkillIndexEntry {
  return {
    skill: 'SQL',
    gained: true,
    pathCount: 1,
    origins: [
      {
        pathId: 'path-1',
        contextId: 'ctx-1',
        pathName: 'Data Foundations',
        pathStatus: 'ongoing',
        levelName: 'Foundations',
        levelIndex: 1,
        gained: true,
      },
    ],
    ...overrides,
  };
}

describe('SkillCard', () => {
  it('renders the skill name and expands to show its origins', () => {
    render(
      <MemoryRouter>
        <SkillCard entry={entry()} isExpanded onToggle={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByTestId('skill-card-origins')).toBeInTheDocument();
  });

  // Regression: the "earned from" origin link didn't set `state.from`, so
  // useLearningPathBackNavigation's Go Back always fell through to its
  // /explore default instead of returning to My Skills (see bug: Go Back
  // from a Learning Path opened via My Skills lands on Explore).
  it('sets state.from to the current page so Go Back can return to My Skills', () => {
    function LocationState() {
      const location = useLocation();
      return <div data-testid="location-state">{JSON.stringify(location.state)}</div>;
    }

    render(
      <MemoryRouter initialEntries={['/my-skills']}>
        <Routes>
          <Route path="/my-skills" element={<SkillCard entry={entry()} isExpanded onToggle={vi.fn()} />} />
          <Route path="/learning-path/:pathId/batch/:contextId/status" element={<LocationState />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Data Foundations'));
    expect(screen.getByTestId('location-state')).toHaveTextContent('{"from":"/my-skills"}');
  });
});
