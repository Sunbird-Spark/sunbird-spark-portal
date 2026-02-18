import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyLearning from './MyLearning';
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { TrackableCollection } from '@/types/TrackableCollections';
import { useIsMobile } from '@/hooks/use-mobile'; // Fixed import path - removed .ts
import { useAppI18n } from '@/hooks/useAppI18n';

// Mock Hooks
vi.mock('@/hooks/useUserEnrolledCollections');
vi.mock('@/hooks/use-mobile'); // Fixed mock path
vi.mock('@/hooks/useAppI18n'); // Mock i18n

// Mock Child Components to test integration without deep rendering
vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="page-loader">{message}</div>,
}));

vi.mock('@/components/home/HomeSidebar', () => ({
  default: () => <div data-testid="home-sidebar">Sidebar</div>,
}));

vi.mock('@/components/home/HomeRecommendedSection', () => ({
  default: () => <div data-testid="home-recommended">Recommended Section</div>,
}));

vi.mock('@/components/myLearning/MyLearningCourses', () => ({
  default: () => <div data-testid="my-learning-courses">My Learning Courses</div>
}));
vi.mock('@/components/myLearning/MyLearningProgress', () => ({
  default: () => <div data-testid="my-learning-hours">Hours Spent</div>
}));
vi.mock('@/components/myLearning/MyLearningUpcomingBatches', () => ({
  default: () => <div data-testid="my-learning-batches">Upcoming Batches</div>
}));

vi.mock('@/components/home/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

// Mock react-icons
vi.mock('react-icons/fi', () => ({
  FiSearch: () => <span />,
  FiBell: () => <span />,
  FiMenu: () => <span data-testid="menu-icon" />,
  FiChevronDown: () => <span />,
  FiChevronLeft: () => <span />,
  FiX: () => <span data-testid="close-icon" />,
}));

describe('MyLearning Page', () => {
  const createMockCourse = (id: string, name: string, percentage: number): TrackableCollection => ({
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
  progress: percentage === 100 ? 5 : 1,
  leafNodesCount: 5,
  description: `Description for ${name}`,
  courseLogoUrl: '',
  dateTime: 1770290316793,
  enrolledDate: 1770290214120,
  batch: {
    identifier: `batch-${id}`,
    batchId: `batch-${id}`,
    name: `Batch for ${name}`,
    startDate: '2023-01-01',
    status: 1,
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
  createMockCourse('1', 'C1', 10),
  createMockCourse('2', 'C2', 100),
];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Mocks
    (useUserEnrolledCollections as any).mockReturnValue({
      isLoading: false,
      data: { data: { courses: mockCourses } },
      error: null,
    });

    (useIsMobile as any).mockReturnValue(false); // Default Desktop
    
    (useAppI18n as any).mockReturnValue({
        t: (key: string) => key,
        languages: [{ code: 'en', label: 'English' }],
        currentCode: 'en',
        changeLanguage: vi.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <MyLearning />
      </BrowserRouter>
    );
  };

  it('renders loading state', () => {
    (useUserEnrolledCollections as any).mockReturnValue({
      isLoading: true,
      data: null,
      error: null,
    });
    renderComponent();
    expect(screen.getByTestId('page-loader')).toHaveTextContent('Loading your learning...');
  });

  it('renders main layout components (Desktop)', () => {
    renderComponent();
    
    expect(screen.getByTestId('home-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByAltText('Sunbird')).toBeInTheDocument(); // Logo
  });

  it('renders content sections', () => {
    renderComponent();
    
    expect(screen.getByTestId('my-learning-courses')).toHaveTextContent('My Learning Courses');
    expect(screen.getByTestId('my-learning-hours')).toBeInTheDocument();
    expect(screen.getByTestId('my-learning-batches')).toBeInTheDocument();
    expect(screen.getByTestId('home-recommended')).toBeInTheDocument();
  });

  it('toggles sidebar on mobile', () => {
    (useIsMobile as any).mockReturnValue(true);
    renderComponent();
    
    // Sidebar should be hidden initially on mobile (controlled by Sheet)
    // But our mock just renders "Sidebar" if open. 
    // In the real code: open={isSidebarOpen}
    // We can test if the toggle button exists
    const menuBtn = screen.getByTestId('menu-icon');
    expect(menuBtn).toBeInTheDocument();
    
    // Clicking it should trigger state change (can't easily verify state change without checking Props of Sheet)
    // But we can check that we don't crash.
    fireEvent.click(menuBtn.parentElement!); 
  });
});
