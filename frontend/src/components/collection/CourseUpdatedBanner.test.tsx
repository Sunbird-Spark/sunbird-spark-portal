import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseUpdatedBanner, { shouldShowCourseUpdatedBanner } from './CourseUpdatedBanner';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

describe('shouldShowCourseUpdatedBanner', () => {
  it('returns true when lastPublishedOn is after enrolledDate', () => {
    const enrolled = new Date('2026-01-01T00:00:00Z').getTime();
    expect(shouldShowCourseUpdatedBanner(enrolled, '2026-03-15T10:30:00.000Z')).toBe(true);
  });

  it('returns true when enrolledDate is an ISO string and lastPublishedOn is later', () => {
    expect(
      shouldShowCourseUpdatedBanner('2026-05-27T06:08:37.262+00:00', '2026-05-27T06:11:58.385+0000')
    ).toBe(true);
  });

  it('returns false when enrolledDate is an ISO string and lastPublishedOn is earlier', () => {
    expect(
      shouldShowCourseUpdatedBanner('2026-05-28T00:00:00.000+00:00', '2026-05-27T06:11:58.385+0000')
    ).toBe(false);
  });

  it('returns false when enrolledDate is an unparseable string', () => {
    expect(shouldShowCourseUpdatedBanner('not-a-date', '2026-05-27T06:11:58.385+0000')).toBe(false);
  });

  it('returns false when lastPublishedOn is before enrolledDate', () => {
    const enrolled = new Date('2026-04-01T00:00:00Z').getTime();
    expect(shouldShowCourseUpdatedBanner(enrolled, '2026-03-15T10:30:00.000Z')).toBe(false);
  });

  it('returns false when lastPublishedOn equals enrolledDate', () => {
    const ts = new Date('2026-03-15T10:30:00.000Z').getTime();
    expect(shouldShowCourseUpdatedBanner(ts, '2026-03-15T10:30:00.000Z')).toBe(false);
  });

  it('returns false when enrolledDate is undefined', () => {
    expect(shouldShowCourseUpdatedBanner(undefined, '2026-03-15T10:30:00.000Z')).toBe(false);
  });

  it('treats enrolledDate === 0 (epoch start) as a valid date, not as missing', () => {
    expect(shouldShowCourseUpdatedBanner(0, '2026-03-15T10:30:00.000Z')).toBe(true);
  });

  it('returns false when lastPublishedOn is undefined', () => {
    expect(shouldShowCourseUpdatedBanner(1700000000000, undefined)).toBe(false);
  });

  it('returns false when lastPublishedOn is unparseable', () => {
    expect(shouldShowCourseUpdatedBanner(1700000000000, 'not-a-date')).toBe(false);
  });
});

describe('CourseUpdatedBanner', () => {
  it('opens the dialog automatically and shows the title and date message', () => {
    render(<CourseUpdatedBanner lastPublishedOn="2026-03-15T10:30:00.000Z" collectionId="col_123" />);
    expect(screen.getByText(/collection\.courseUpdatedTitle/)).toBeInTheDocument();
    expect(screen.getByText(/collection\.courseUpdatedOnMessage/)).toBeInTheDocument();
  });

  it('closes the dialog when the close control is activated', () => {
    render(<CourseUpdatedBanner lastPublishedOn="2026-03-15T10:30:00.000Z" collectionId="col_123" />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText(/collection\.courseUpdatedTitle/)).not.toBeInTheDocument();
  });

  it('renders nothing when the date is invalid', () => {
    const { container } = render(<CourseUpdatedBanner lastPublishedOn="not-a-date" collectionId="col_123" />);
    expect(container.firstChild).toBeNull();
  });

  it('does not auto-reopen after dismissal on the same course (within the same mount)', () => {
    const { rerender } = render(
      <CourseUpdatedBanner lastPublishedOn="2026-03-15T10:30:00.000Z" collectionId="col_123" />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText(/collection\.courseUpdatedTitle/)).not.toBeInTheDocument();
    rerender(
      <CourseUpdatedBanner lastPublishedOn="2026-03-15T10:30:00.000Z" collectionId="col_123" />
    );
    expect(screen.queryByText(/collection\.courseUpdatedTitle/)).not.toBeInTheDocument();
  });
});
