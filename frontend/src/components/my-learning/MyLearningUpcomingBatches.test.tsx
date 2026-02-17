import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyLearningUpcomingBatches from './MyLearningUpcomingBatches';
import { Course } from '@/types/courseTypes';

// Mock Course Data
const mockBatches: Course[] = [
  {
    courseId: '1',
    courseName: 'Batch 1',
    description: 'Desc 1',
    leafNodesCount: 5,
    lastUpdatedOn: '2023-01-01',
    appIcon: '',
    completionPercentage: 0,
    progress: 0,
    content: { appIcon: '' },
    batch: {
        batchId: 'b1',
        startDate: '2023-10-15',
        endDate: '',
        status: 1,
        enrollmentType: 'open',
        createdBy: 'user1'
    }
  },
  {
    courseId: '2',
    courseName: 'Batch 2',
    description: 'Desc 2',
    leafNodesCount: 3,
    lastUpdatedOn: '2023-01-01',
    appIcon: '',
    completionPercentage: 0,
    progress: 0,
    content: { appIcon: '' },
    batch: {
        batchId: 'b2',
        startDate: '2023-10-15',
        endDate: '',
        status: 1,
        enrollmentType: 'open',
        createdBy: 'user1'
    }
  },
  {
    courseId: '3',
    courseName: 'Batch 3',
    description: 'Desc 3',
    leafNodesCount: 8,
    lastUpdatedOn: '2023-01-01',
    appIcon: '',
    completionPercentage: 0,
    progress: 0,
    content: { appIcon: '' },
    batch: {
        batchId: 'b3',
        startDate: '2023-11-20',
        endDate: '',
        status: 1,
        enrollmentType: 'open',
        createdBy: 'user1'
    }
  }
];

describe('MyLearningUpcomingBatches', () => {
  it('renders the title correctly', () => {
    render(<MyLearningUpcomingBatches upcomingBatches={[]} />);
    expect(screen.getByText('Upcoming Batches')).toBeInTheDocument();
  });

  it('renders "No upcoming batches" message when list is empty', () => {
    render(<MyLearningUpcomingBatches upcomingBatches={[]} />);
    expect(screen.getByText('No upcoming batches scheduled.')).toBeInTheDocument();
  });

  it('renders grouped batches correctly', () => {
    render(<MyLearningUpcomingBatches upcomingBatches={mockBatches} />);

    // Check for batch titles
    expect(screen.getByText('Batch 1')).toBeInTheDocument();
    expect(screen.getByText('Batch 2')).toBeInTheDocument();
    expect(screen.getByText('Batch 3')).toBeInTheDocument();

    // Check for lesson counts
    expect(screen.getByText('5 Lessons')).toBeInTheDocument();
    expect(screen.getByText('3 Lessons')).toBeInTheDocument();
    expect(screen.getByText('8 Lessons')).toBeInTheDocument();
  });

  it('limits to 10 batches', () => {
     // Create 12 dummy batches
     const manyBatches = Array.from({ length: 12 }, (_, i) => ({
        ...mockBatches[0]!,
        courseId: `id-${i}`,
        courseName: `Batch Test ${i}`,
        batch: { ...mockBatches[0]!.batch, startDate: '2023-12-01' },
        content: { appIcon: '' },
        completionPercentage: 0
     }));

     render(<MyLearningUpcomingBatches upcomingBatches={manyBatches} />);
     
     // Should only show 10
     const batchItems = screen.getAllByText(/Batch Test/);
     expect(batchItems.length).toBe(10);
  });
});
