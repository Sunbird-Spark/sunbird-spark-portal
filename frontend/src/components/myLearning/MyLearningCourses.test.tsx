import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import MyLearningCourses from './MyLearningCourses';
import { TrackableCollection } from '@/types/TrackableCollections';

// Mock TrackableCollectionCard to avoid deep rendering
vi.mock('../content/TrackableCollectionCard', () => ({
  default: ({ course }: { course: TrackableCollection }) => (
    <div data-testid="course-card">
      {course.courseName} - {course.completionPercentage}%
    </div>
  ),
}));

// Mock react-icons
vi.mock('react-icons/fi', () => ({
  FiChevronDown: () => <span data-testid="chevron-down" />,
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'profileLearning.viewMoreCourses': 'View More Courses',
      };
      return translations[key] ?? key;
    },
  }),
}));

const createMockCourse = (
  id: string,
  name: string,
  percentage: number,
  startDate: string = '2023-01-01'
): TrackableCollection => ({
  courseId: id,
  courseName: name,
  collectionId: id,
  contentId: id,
  batchId: `batch-${id}`,
  userId: 'user_123',
  addedBy: 'admin_123',
  active: true,
  status: 2,
  completionPercentage: percentage,
  progress: percentage === 100 ? 5 : percentage > 0 ? 1 : 0,
  leafNodesCount: 5,
  description: `Description for ${name}`,
  courseLogoUrl: '',
  dateTime: 1770290316793,
  enrolledDate: 1770290214120,
  batch: {
    identifier: `batch-${id}`,
    batchId: `batch-${id}`,
    name: `Batch for ${name}`,
    startDate,
    status: startDate > new Date().toISOString().slice(0, 10) ? 0 : 1,
    enrollmentType: 'open',
    createdBy: 'user1'
  },
  content: {
    identifier: id,
    name: name,
    description: `Description for ${name}`,
    appIcon: '',
    mimeType: 'application/vnd.ekstep.content-collection',
    primaryCategory: 'Course',
    contentType: 'Course',
    resourceType: 'Course',
    objectType: 'Content',
    pkgVersion: 1,
    channel: 'channel_123',
    organisation: ['Sunbird Org'],
    trackable: {
      enabled: 'Yes',
      autoBatch: 'No'
    }
  }
});

const mockCourses: TrackableCollection[] = [
  createMockCourse('1', 'Active Course 1', 10),
  createMockCourse('2', 'Active Course 2', 50),
  createMockCourse('3', 'Completed Course 1', 100),
];

describe('MyLearningCourses', () => {
  it('renders "Courses" title and tabs', () => {
    render(<MyLearningCourses courses={mockCourses} />);
    expect(screen.getByText('courses')).toBeInTheDocument();
    expect(screen.getByText('status.active courses')).toBeInTheDocument();
    expect(screen.getByText('status.completed')).toBeInTheDocument();
    expect(screen.getByText('status.upcoming')).toBeInTheDocument();
  });

  it('displays active courses by default', () => {
    render(<MyLearningCourses courses={mockCourses} />);
    
    // Should show Active Course 1 and 2
    expect(screen.getByText(/Active Course 1/)).toBeInTheDocument();
    expect(screen.getByText(/Active Course 2/)).toBeInTheDocument();
    
    // Should NOT show Completed Course 1
    expect(screen.queryByText(/Completed Course 1/)).not.toBeInTheDocument();
  });

  it('switches to "Completed" tab and shows completed courses', () => {
    render(<MyLearningCourses courses={mockCourses} />);
    
    const completedTab = screen.getByText('status.completed');
    fireEvent.click(completedTab);
    
    // Should show Completed Course 1
    expect(screen.getByText(/Completed Course 1/)).toBeInTheDocument();
    
    // Should NOT show Active Course 1
    expect(screen.queryByText(/Active Course 1/)).not.toBeInTheDocument();
  });

  it('filters empty list correctly', () => {
    render(<MyLearningCourses courses={[]} />);
    expect(screen.getByText('No courses found in this category.')).toBeInTheDocument();
  });
  
  describe('Upcoming tab categorization', () => {
    const FIXED_DATE = new Date('2025-06-15T12:00:00');
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_DATE);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows a course in Upcoming when startDate is in the future and progress is 0%', () => {
      const courses = [createMockCourse('u1', 'Future Course', 0, '2099-12-31')];
      render(<MyLearningCourses courses={courses} />);
      fireEvent.click(screen.getByText('status.upcoming'));
      expect(screen.getByText(/Future Course/)).toBeInTheDocument();
    });

    it('does not show a course in Upcoming when startDate is today', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const courses = [createMockCourse('u2', 'Today Course', 0, today)];
      render(<MyLearningCourses courses={courses} />);
      fireEvent.click(screen.getByText('status.upcoming'));
      expect(screen.queryByText(/Today Course/)).not.toBeInTheDocument();
    });

    it('shows a course starting today in Active tab instead of Upcoming', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const courses = [createMockCourse('u3', 'Today Active Course', 0, today)];
      render(<MyLearningCourses courses={courses} />);
      expect(screen.getByText(/Today Active Course/)).toBeInTheDocument();
    });

    it('does not show a course in Upcoming when progress is greater than 0', () => {
      const courses = [createMockCourse('u4', 'Partial Future Course', 10, '2099-12-31')];
      render(<MyLearningCourses courses={courses} />);
      fireEvent.click(screen.getByText('status.upcoming'));
      expect(screen.queryByText(/Partial Future Course/)).not.toBeInTheDocument();
    });

    it('does not show a completed course in Upcoming even when startDate is in the future', () => {
      const courses = [createMockCourse('u5', 'Completed Future Course', 100, '2099-12-31')];
      render(<MyLearningCourses courses={courses} />);
      fireEvent.click(screen.getByText('status.upcoming'));
      expect(screen.queryByText(/Completed Future Course/)).not.toBeInTheDocument();
    });

    it('does not show a future-batch course with 0% progress in Active tab', () => {
      const courses = [createMockCourse('u6', 'Not Started Future Course', 0, '2099-12-31')];
      render(<MyLearningCourses courses={courses} />);
      expect(screen.queryByText(/Not Started Future Course/)).not.toBeInTheDocument();
    });

    it('correctly handles UTC datetime startDate for today without timezone bug', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const todayUTCMidnight = today + 'T00:00:00.000Z';
      const courses = [createMockCourse('u7', 'UTC Today Course', 0, todayUTCMidnight)];
      render(<MyLearningCourses courses={courses} />);
      fireEvent.click(screen.getByText('status.upcoming'));
      expect(screen.queryByText(/UTC Today Course/)).not.toBeInTheDocument();
    });

    it('correctly handles UTC datetime startDate for a future date in Upcoming', () => {
      const courses = [createMockCourse('u8', 'UTC Future Course', 0, '2099-12-31T00:00:00.000Z')];
      render(<MyLearningCourses courses={courses} />);
      fireEvent.click(screen.getByText('status.upcoming'));
      expect(screen.getByText(/UTC Future Course/)).toBeInTheDocument();
    });
  });

  it('shows "View More Courses" button when there are many courses', () => {
    // Create 12 active courses
    const manyCourses = Array.from({ length: 12 }, (_, i): TrackableCollection => ({
      ...mockCourses[0]!,
      courseId: `id-${i}`,
      collectionId: `id-${i}`,
      contentId: `id-${i}`,
      courseName: `Course ${i}`,
      completionPercentage: 10,
      batch: {
        ...mockCourses[0]!.batch!,
        batchId: `batch-${i}`,
        identifier: `batch-${i}`,
        startDate: '2023-01-01',
        status: 1,
        enrollmentType: 'open',
        createdBy: 'user1',
        name: `Batch for Course ${i}`
      }
    }));
    
    render(<MyLearningCourses courses={manyCourses} />);
    
    // Should show the button
    expect(screen.getByText('View More Courses')).toBeInTheDocument();
    
    // Only 9 should be visible initially
    const cards = screen.getAllByTestId('course-card');
    expect(cards.length).toBe(9);
    
    // Click view more
    fireEvent.click(screen.getByText('View More Courses'));
    
    // Now all 12 should be visible
    const allCards = screen.getAllByTestId('course-card');
    expect(allCards.length).toBe(12);
    
    // Button should disappear if no more courses
    expect(screen.queryByText('View More Courses')).not.toBeInTheDocument();
  });
});
