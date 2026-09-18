import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelSkillsCard } from './LevelSkillsCard';
import type { PathSkill } from '@/services/learningPath/pathSkillStatus';

vi.mock('@/hooks/useAppI18n', () => ({ useAppI18n: () => ({ t: (k: string) => k }) }));

const states: Record<string, PathSkill> = {
  'hand-hygiene': { code: 'hand-hygiene', state: 'held', percent: 0, notTaught: false },
  'ppe-use': { code: 'ppe-use', state: 'inProgress', percent: 40, notTaught: false },
  'sterile-field': { code: 'sterile-field', state: 'notStarted', percent: 0, notTaught: false },
};
const codes = Object.keys(states);
const name = (c: string) => c.replace(/-/g, ' ');

describe('LevelSkillsCard', () => {
  // The old card labelled every skill "In scope", which is true from publish day and tells a
  // learner nothing - mastered and never-opened read identically.
  it('reports each skill its real state rather than a blanket label', () => {
    render(<LevelSkillsCard codes={codes} stateOf={(c) => states[c]} name={name} />);
    expect(screen.getByTestId('level-skill-hand-hygiene')).toHaveTextContent('skillHeld');
    expect(screen.getByTestId('level-skill-ppe-use')).toHaveTextContent('40%');
    expect(screen.getByTestId('level-skill-sterile-field')).toHaveTextContent('skillNotStarted');
  });

  it('shows the skill name, not the raw code', () => {
    render(<LevelSkillsCard codes={codes} stateOf={(c) => states[c]} name={name} />);
    expect(screen.getByTestId('level-skill-hand-hygiene')).toHaveTextContent('hand hygiene');
  });

  // An unenrolled visitor, or a path with no competency framework, has no state to show.
  it('falls back to "In scope" when there is no state available', () => {
    render(<LevelSkillsCard codes={['hand-hygiene']} name={name} />);
    expect(screen.getByTestId('level-skill-hand-hygiene')).toHaveTextContent('inScope');
  });

  it('shows the empty state when the level scopes nothing', () => {
    render(<LevelSkillsCard codes={[]} name={name} />);
    expect(screen.getByText('learningPath.noSkillsYet')).toBeInTheDocument();
  });
});
