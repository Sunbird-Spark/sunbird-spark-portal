export interface ScoreRow {
  name: string;
  sub: string;
  score: string;
  pct: number;
}

interface ScoreRowsProps {
  rows: ScoreRow[];
}

/** "Your scores" list on the completion screen. */
export function ScoreRows({ rows }: ScoreRowsProps) {
  return (
    <div className="flex flex-col">
      {rows.map((row) => (
        <div key={row.name} className="grid grid-cols-[1fr_8.125rem_4.375rem] items-center gap-3.5 border-t border-sunbird-gray-e5 py-3.5 first:border-t-0">
          <div>
            <span className="block text-sm font-medium text-foreground">{row.name}</span>
            <span className="text-xs text-sunbird-gray-75">{row.sub}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-pill bg-sunbird-gray-e5">
            <div className="h-full rounded-pill bg-sunbird-brick" style={{ width: `${row.pct}%` }} />
          </div>
          <span className="text-right text-sm font-medium text-sunbird-ink">{row.score}</span>
        </div>
      ))}
    </div>
  );
}
