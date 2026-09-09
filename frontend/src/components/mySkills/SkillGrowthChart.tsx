import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppI18n } from '@/hooks/useAppI18n';
import ChartCard from '@/components/reports/ChartCard';
import type { SkillGrowthSeries } from '@/services/learningPath/skillGrowth';

interface SkillGrowthChartProps {
  series: SkillGrowthSeries;
}

/**
 * The honest substitute for a numeric "skill score" trend, which our data
 * doesn't have: a cumulative count of skills gained over time. Renders
 * nothing when there aren't at least two distinct days to plot — a
 * single-point "trend" would be noise, not a line.
 */
export function SkillGrowthChart({ series }: SkillGrowthChartProps) {
  const { t } = useAppI18n();
  const { points, undatedCount } = series;

  if (points.length < 2) return null;

  return (
    <ChartCard title={t('mySkills.growthTitle')}>
      <div className="h-40" data-testid="skill-growth-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Line
              type="stepAfter"
              dataKey="cumulative"
              stroke="hsl(var(--sunbird-theme-accent-muted))"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name={t('mySkills.growthTitle')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {undatedCount > 0 && (
        <p className="mt-2 text-xs text-sunbird-gray-75">{t('mySkills.growthUndated', { count: undatedCount })}</p>
      )}
    </ChartCard>
  );
}
