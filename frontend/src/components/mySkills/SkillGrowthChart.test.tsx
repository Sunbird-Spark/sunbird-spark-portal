import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillGrowthChart } from './SkillGrowthChart';
import type { SkillGrowthSeries } from '@/services/learningPath/skillGrowth';

// Mock recharts to avoid canvas/layout errors in jsdom.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
  }),
}));

function series(overrides: Partial<SkillGrowthSeries> = {}): SkillGrowthSeries {
  return {
    points: [
      { date: 1, label: 'Jan 1', cumulative: 1 },
      { date: 2, label: 'Jan 2', cumulative: 3 },
    ],
    undatedCount: 0,
    ...overrides,
  };
}

describe('SkillGrowthChart', () => {
  it('renders the chart when there are at least two points', () => {
    render(<SkillGrowthChart series={series()} />);
    expect(screen.getByTestId('skill-growth-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders nothing when there are fewer than two points', () => {
    const { container } = render(<SkillGrowthChart series={series({ points: [] })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the undated-skills footnote when applicable', () => {
    render(<SkillGrowthChart series={series({ undatedCount: 3 })} />);
    expect(screen.getByText(/mySkills.growthUndated/)).toBeInTheDocument();
  });

  it('omits the footnote when every gained skill has a date', () => {
    render(<SkillGrowthChart series={series({ undatedCount: 0 })} />);
    expect(screen.queryByText(/mySkills.growthUndated/)).not.toBeInTheDocument();
  });
});
