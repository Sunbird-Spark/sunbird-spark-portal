import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Returns a human-readable relative time string for an ISO datetime.
 * Examples: "a few seconds ago", "5 minutes ago", "3 hours ago", "5 days ago",
 *           "a month ago", "4 months ago", "a year ago", "2 years ago".
 * Returns '—' for invalid dates.
 */
export function toRelativeTime(isoString: string, now: Date = new Date()): string {
  const past = dayjs(isoString);
  if (!past.isValid()) return '—';
  return past.from(dayjs(now));
}
