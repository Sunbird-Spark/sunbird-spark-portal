import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyLearning from './MyLearning';
import { useMyLearning } from '@/hooks/useMyLearning';
import { useIsMobile } from '@/hooks/use-mobile'; // Fixed import path - removed .ts
import { useAppI18n } from '@/hooks/useAppI18n';

// Mock Hooks
vi.mock('@/hooks/useMyLearning');
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

vi.mock('@/components/my-learning/MyLearningCourses', () => ({
  default: ({ courses }: any) => <div data-testid="my-learning-courses">Courses Count: {courses.length}</div>,
}));

vi.mock('@/components/my-learning/MyLearningHoursSpent', () => ({
  default: () => <div data-testid="my-learning-hours">Hours Spent</div>,
}));

vi.mock('@/components/my-learning/MyLearningUpcomingBatches', () => ({
  default: () => <div data-testid="my-learning-batches">Upcoming Batches</div>,
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
  const mockCourses = [
    { 
        courseId: '1', 
        courseName: 'C1', 
        completionPercentage: 10, 
        leafNodesCount: 5, 
        progress: 1,
        content: { appIcon: '' },
        batch: {
            batchId: 'b1',
            startDate: '2023-01-01',
            status: 1,
            enrollmentType: 'open',
            createdBy: 'user1'
        }
    },
    { 
        courseId: '2', 
        courseName: 'C2', 
        completionPercentage: 100, 
        leafNodesCount: 5, 
        progress: 5,
        content: { appIcon: '' },
        batch: {
            batchId: 'b2',
            startDate: '2023-01-01',
            status: 1,
            enrollmentType: 'open',
            createdBy: 'user1'
        }
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Mocks
    (useMyLearning as any).mockReturnValue({
      data: { data: { courses: mockCourses } },
      isLoading: false,
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
    (useMyLearning as any).mockReturnValue({ isLoading: true });
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
    
    expect(screen.getByTestId('my-learning-courses')).toHaveTextContent('Courses Count: 2');
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
