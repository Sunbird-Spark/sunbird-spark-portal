import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyLearningCourses from './MyLearningCourses';
import { Course } from '@/types/courseTypes';

// Mock TrackableCollectionCard to avoid deep rendering
vi.mock('../content/TrackableCollectionCard', () => ({
  default: ({ course }: { course: Course }) => (
    <div data-testid="course-card">
      {course.courseName} - {course.completionPercentage}%
    </div>
  ),
}));

// Mock react-icons
vi.mock('react-icons/fi', () => ({
  FiChevronDown: () => <span data-testid="chevron-down" />,
}));

const mockCourses: Course[] = [
  {
    courseId: '1',
    courseName: 'Active Course 1',
    description: 'Desc 1',
    completionPercentage: 10,
    leafNodesCount: 5,
    lastUpdatedOn: '2023-01-01',
    appIcon: '',
    content: { appIcon: '' },
    progress: 1,
  },
  {
    courseId: '2',
    courseName: 'Active Course 2',
    description: 'Desc 2',
    completionPercentage: 50,
    leafNodesCount: 5,
    lastUpdatedOn: '2023-01-01',
    appIcon: '',
    content: { appIcon: '' },
    progress: 5,
  },
  {
    courseId: '3',
    courseName: 'Completed Course 1',
    description: 'Desc 3',
    completionPercentage: 100,
    leafNodesCount: 5,
    lastUpdatedOn: '2023-01-01',
    appIcon: '',
    content: { appIcon: '' },
    progress: 5,
  },
];

describe('MyLearningCourses', () => {
  it('renders "Courses" title and tabs', () => {
    render(<MyLearningCourses courses={mockCourses} />);
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Active Courses')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
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
    
    const completedTab = screen.getByText('Completed');
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
  
  it('shows "View more courses" button when there are many courses', () => {
    // Create 12 active courses
    const manyCourses = Array.from({ length: 12 }, (_, i) => ({
      ...mockCourses[0],
      courseId: `id-${i}`,
      courseName: `Course ${i}`,
      completionPercentage: 10,
      content: { appIcon: '' },
    }));
    
    render(<MyLearningCourses courses={manyCourses} />);
    
    // Should show the button
    expect(screen.getByText('View more courses')).toBeInTheDocument();
    
    // Only 9 should be visible initially
    const cards = screen.getAllByTestId('course-card');
    expect(cards.length).toBe(9);
    
    // Click view more
    fireEvent.click(screen.getByText('View more courses'));
    
    // Now all 12 should be visible
    const allCards = screen.getAllByTestId('course-card');
    expect(allCards.length).toBe(12);
    
    // Button should disappear if no more courses
    expect(screen.queryByText('View more courses')).not.toBeInTheDocument();
  });
});
