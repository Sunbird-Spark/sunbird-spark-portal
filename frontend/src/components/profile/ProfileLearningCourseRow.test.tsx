import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseRow from './ProfileLearningCourseRow';
import type { TrackableCollection } from '@/types/TrackableCollections';

const t = (key: string) => key;
const noop = async () => undefined;

function buildCourse(overrides: Partial<TrackableCollection> = {}): TrackableCollection {
  return {
    courseId: 'c1',
    courseName: 'Course 1',
    collectionId: 'c1',
    contentId: 'c1',
    batchId: 'b1',
    userId: 'u1',
    addedBy: 'u1',
    active: true,
    status: 1,
    completionPercentage: 50,
    progress: 50,
    leafNodesCount: 1,
    description: '',
    courseLogoUrl: '',
    dateTime: 0,
    enrolledDate: 0,
    ...overrides,
  } as TrackableCollection;
}

describe('ProfileLearningCourseRow', () => {
  it('links a plain course to /collection/:courseId', () => {
    render(
      <MemoryRouter>
        <CourseRow
          course={buildCourse({ content: { primaryCategory: 'Course' } as never })}
          downloadCertificate={noop}
          hasCertificate={() => false}
          downloadingCourseId={null}
          t={t}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/collection/c1');
  });

  it('links a Learning Path enrolment to its status page with the batchId as contextId', () => {
    render(
      <MemoryRouter>
        <CourseRow
          course={buildCourse({ courseId: 'lp1', batchId: 'batch9', content: { primaryCategory: 'Learning Path' } as never })}
          downloadCertificate={noop}
          hasCertificate={() => false}
          downloadingCourseId={null}
          t={t}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/learning-path/lp1/batch/batch9/status');
  });

  it('falls back to the plain status path when a Learning Path enrolment has no batchId', () => {
    render(
      <MemoryRouter>
        <CourseRow
          course={buildCourse({ courseId: 'lp1', batchId: '', content: { primaryCategory: 'Learning Path' } as never })}
          downloadCertificate={noop}
          hasCertificate={() => false}
          downloadingCourseId={null}
          t={t}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/learning-path/lp1/status');
  });
});
