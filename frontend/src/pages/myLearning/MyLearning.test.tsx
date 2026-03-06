import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { BrowserRouter } from 'react-router-dom';
import MyLearning from './MyLearning';
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { TrackableCollection } from '@/types/TrackableCollections';
import { useAppI18n } from '@/hooks/useAppI18n';

vi.mock('@/hooks/useUserEnrolledCollections', () => ({
  useUserEnrolledCollections: vi.fn(),
}));
vi.mock('@/hooks/useAppI18n');

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="page-loader">{message}</div>,
}));

vi.mock('@/components/home/HomeRecommendedSection', () => ({
  default: () => <div data-testid="home-recommended">Recommended Section</div>,
}));

vi.mock('@/components/myLearning/MyLearningCourses', () => ({
  default: () => <div data-testid="my-learning-courses">My Learning Courses</div>,
}));
vi.mock('@/components/myLearning/MyLearningProgress', () => ({
  default: () => <div data-testid="my-learning-hours">Hours Spent</div>,
}));

const mockUpcomingBatches = vi.fn();
vi.mock('@/components/myLearning/MyLearningUpcomingBatches', () => ({
  default: (props: { upcomingBatches: TrackableCollection[] }) => {
    mockUpcomingBatches(props.upcomingBatches);
    return <div data-testid="my-learning-batches">Upcoming Batches</div>;
  },
}));

describe('MyLearning Page', () => {
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
      status: 1,
      enrollmentType: 'open',
      createdBy: 'user1',
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
      trackable: { enabled: 'Yes', autoBatch: 'No' },
    },
  });

  const mockCourses: TrackableCollection[] = [
    createMockCourse('1', 'C1', 10),
    createMockCourse('2', 'C2', 100),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useUserEnrolledCollections as any).mockReturnValue({
      isLoading: false,
      data: { data: { courses: mockCourses } },
      error: null,
    });

    (useAppI18n as any).mockReturnValue({
      t: (key: string) => {
        if (key === 'myLearning.loading') return 'Loading your learning...';
        return key;
      },
    });
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <MyLearning />
      </BrowserRouter>
    );

  it('renders loading state', () => {
    (useUserEnrolledCollections as any).mockReturnValue({
      isLoading: true,
      data: null,
      error: null,
    });
    renderComponent();
    expect(screen.getByTestId('page-loader')).toHaveTextContent('Loading your learning...');
  });

  it('renders content sections', () => {
    renderComponent();

    expect(screen.getByTestId('my-learning-courses')).toHaveTextContent('My Learning Courses');
    expect(screen.getByTestId('my-learning-hours')).toBeInTheDocument();
    expect(screen.getByTestId('my-learning-batches')).toBeInTheDocument();
    expect(screen.getByTestId('home-recommended')).toBeInTheDocument();
  });

  describe('upcomingBatches filter passed to MyLearningUpcomingBatches', () => {
    const FIXED_NOW = new Date('2025-06-15T12:00:00');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('passes only 0% progress courses with future startDate as upcoming batches', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const futureDateStr = '2099-12-31';
      const courses = [
        createMockCourse('1', 'Future Not Started', 0, futureDateStr),
        createMockCourse('2', 'Future Partial', 10, futureDateStr),
        createMockCourse('3', 'Future Completed', 100, futureDateStr),
        createMockCourse('4', 'Past Not Started', 0, '2023-01-01'),
        createMockCourse('5', 'Today Not Started', 0, today),
      ];

      (useUserEnrolledCollections as any).mockReturnValue({
        isLoading: false,
        data: { data: { courses } },
        error: null,
      });

      renderComponent();

      expect(mockUpcomingBatches).toHaveBeenCalled();
      const lastCallArgs = mockUpcomingBatches.mock.calls[mockUpcomingBatches.mock.calls.length - 1]!;
      const passed = lastCallArgs[0] as TrackableCollection[];
      expect(passed).toHaveLength(1);
      expect(passed[0]!.courseName).toBe('Future Not Started');
    });

    it('excludes courses with any progress from upcoming batches even if startDate is future', () => {
      const courses = [
        createMockCourse('1', 'Partial Future', 50, '2099-12-31'),
        createMockCourse('2', 'Complete Future', 100, '2099-12-31'),
      ];

      (useUserEnrolledCollections as any).mockReturnValue({
        isLoading: false,
        data: { data: { courses } },
        error: null,
      });

      renderComponent();

      expect(mockUpcomingBatches).toHaveBeenCalled();
      const lastCallArgs = mockUpcomingBatches.mock.calls[mockUpcomingBatches.mock.calls.length - 1]!;
      const passed = lastCallArgs[0] as TrackableCollection[];
      expect(passed).toHaveLength(0);
    });

    it('excludes courses starting today from upcoming batches', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const courses = [createMockCourse('1', 'Today Batch', 0, today)];

      (useUserEnrolledCollections as any).mockReturnValue({
        isLoading: false,
        data: { data: { courses } },
        error: null,
      });

      renderComponent();

      expect(mockUpcomingBatches).toHaveBeenCalled();
      const lastCallArgs = mockUpcomingBatches.mock.calls[mockUpcomingBatches.mock.calls.length - 1]!;
      const passed = lastCallArgs[0] as TrackableCollection[];
      expect(passed).toHaveLength(0);
    });

    it('handles UTC midnight startDate for today without timezone bug', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const todayUTCMidnight = `${today}T00:00:00.000Z`;
      const courses = [createMockCourse('1', 'UTC Today Batch', 0, todayUTCMidnight)];

      (useUserEnrolledCollections as any).mockReturnValue({
        isLoading: false,
        data: { data: { courses } },
        error: null,
      });

      renderComponent();

      expect(mockUpcomingBatches).toHaveBeenCalled();
      const lastCallArgs = mockUpcomingBatches.mock.calls[mockUpcomingBatches.mock.calls.length - 1]!;
      const passed = lastCallArgs[0] as TrackableCollection[];
      expect(passed).toHaveLength(0);
    });

    it('passes empty array when no courses have future startDate and 0% progress', () => {
      const courses = [
        createMockCourse('1', 'Past Active', 50, '2023-01-01'),
        createMockCourse('2', 'Past Completed', 100, '2023-01-01'),
      ];

      (useUserEnrolledCollections as any).mockReturnValue({
        isLoading: false,
        data: { data: { courses } },
        error: null,
      });

      renderComponent();

      expect(mockUpcomingBatches).toHaveBeenCalled();
      const lastCallArgs = mockUpcomingBatches.mock.calls[mockUpcomingBatches.mock.calls.length - 1]!;
      const passed = lastCallArgs[0] as TrackableCollection[];
      expect(passed).toHaveLength(0);
    });
  });
});
