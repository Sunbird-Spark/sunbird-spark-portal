/**
 * Returns a human-readable relative time string for an ISO datetime.
 * Examples: "just now", "5 minutes ago", "3 hours ago", "2 days ago",
 *           "last week", "3 weeks ago", "last month", "4 months ago",
 *           "last year", "2 years ago".
 */
export function toRelativeTime(isoString: string, now: Date = new Date()): string {
  const past = new Date(isoString);
  if (isNaN(past.getTime())) return '—';
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1_000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60)   return 'just now';
  if (diffMin < 60)   return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24)  return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7)    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffWeek < 4)   return diffWeek === 1 ? 'last week' : `${diffWeek} weeks ago`;
  if (diffMonth < 12) return diffMonth === 1 ? 'last month' : `${diffMonth} months ago`;
  return diffYear === 1 ? 'last year' : `${diffYear} years ago`;
}
