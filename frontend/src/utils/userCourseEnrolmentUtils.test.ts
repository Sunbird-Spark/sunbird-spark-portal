import { describe, it, expect } from 'vitest';
import { toRelativeTime } from './dateUtils';
import { mapApiItemToUserCourseProgress } from './userCourseEnrolmentUtils';
import type { UserCourseEnrolmentApiItem } from '@/types/reports';

// Fixed reference point for all relative-time tests
const NOW = new Date('2026-03-12T12:00:00.000Z');

const at = (iso: string) => new Date(iso).getTime();
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const daysAgo  = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

describe('toRelativeTime', () => {
  it('returns "just now" for < 60 seconds ago', () => {
    const ts = new Date(NOW.getTime() - 30_000).toISOString();
    expect(toRelativeTime(ts, NOW)).toBe('just now');
  });

  it('returns singular "1 minute ago"', () => {
    const ts = new Date(NOW.getTime() - 90_000).toISOString();
    expect(toRelativeTime(ts, NOW)).toBe('1 minute ago');
  });

  it('returns plural "45 minutes ago"', () => {
    const ts = new Date(NOW.getTime() - 45 * 60_000).toISOString();
    expect(toRelativeTime(ts, NOW)).toBe('45 minutes ago');
  });

  it('returns "1 hour ago"', () => {
    expect(toRelativeTime(hoursAgo(1), NOW)).toBe('1 hour ago');
  });

  it('returns "3 hours ago"', () => {
    expect(toRelativeTime(hoursAgo(3), NOW)).toBe('3 hours ago');
  });

  it('returns "1 day ago"', () => {
    expect(toRelativeTime(daysAgo(1), NOW)).toBe('1 day ago');
  });

  it('returns "5 days ago"', () => {
    expect(toRelativeTime(daysAgo(5), NOW)).toBe('5 days ago');
  });

  it('returns "last week" for exactly 7 days ago', () => {
    expect(toRelativeTime(daysAgo(7), NOW)).toBe('last week');
  });

  it('returns "3 weeks ago"', () => {
    expect(toRelativeTime(daysAgo(21), NOW)).toBe('3 weeks ago');
  });

  it('returns "last month" for ~30 days ago', () => {
    expect(toRelativeTime(daysAgo(30), NOW)).toBe('last month');
  });

  it('returns "4 months ago"', () => {
    expect(toRelativeTime(daysAgo(120), NOW)).toBe('4 months ago');
  });

  it('returns "last year" for ~365 days ago', () => {
    expect(toRelativeTime(daysAgo(365), NOW)).toBe('last year');
  });

  it('returns "2 years ago"', () => {
    expect(toRelativeTime(daysAgo(730), NOW)).toBe('2 years ago');
  });
});

describe('mapApiItemToUserCourseProgress', () => {
  const makeItem = (overrides: Partial<UserCourseEnrolmentApiItem>): UserCourseEnrolmentApiItem => ({
    courseid: 'do_1',
    collectionDetails: { name: 'Test Course', identifier: 'do_1', contentType: 'Course' },
    completionpercentage: null,
    status: 1,
    enrolled_date: '2026-03-04T14:14:32.463+00:00',
    datetime: '2026-03-04T14:22:48.576+00:00',
    issued_certificates: null,
    ...overrides,
  });

  it('maps courseid → id', () => {
    expect(mapApiItemToUserCourseProgress(makeItem({}))).toMatchObject({ id: 'do_1' });
  });

  it('maps collectionDetails.name → courseName', () => {
    expect(mapApiItemToUserCourseProgress(makeItem({}))).toMatchObject({ courseName: 'Test Course' });
  });

  it('maps null completionpercentage → 0', () => {
    expect(mapApiItemToUserCourseProgress(makeItem({ completionpercentage: null })).progressPercent).toBe(0);
  });

  it('maps status 0 → Not Started', () => {
    expect(mapApiItemToUserCourseProgress(makeItem({ status: 0 })).status).toBe('Not Started');
  });

  it('maps status 1 → In Progress', () => {
    expect(mapApiItemToUserCourseProgress(makeItem({ status: 1 })).status).toBe('In Progress');
  });

  it('maps status 2 → Completed', () => {
    expect(mapApiItemToUserCourseProgress(makeItem({ status: 2 })).status).toBe('Completed');
  });

  it('maps enrolled_date to date-only string', () => {
    expect(mapApiItemToUserCourseProgress(makeItem({})).enrollmentDate).toBe('2026-03-04');
  });

  it('maps lastAccessed as a relative time string (not a raw date)', () => {
    const result = mapApiItemToUserCourseProgress(makeItem({}));
    // should NOT look like YYYY-MM-DD
    expect(result.lastAccessed).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // should be one of the known relative time formats
    expect(result.lastAccessed).toMatch(/ago|just now|last week|last month|last year/);
  });
});
