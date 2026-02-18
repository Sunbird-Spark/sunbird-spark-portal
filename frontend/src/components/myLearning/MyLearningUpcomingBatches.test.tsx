import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyLearningUpcomingBatches from './MyLearningUpcomingBatches';
import { TrackableCollection, Batch } from '@/types/TrackableCollections';

// Mock Course Data
const createMockUpcomingBatch = (id: string, name: string, startDate: string, leafNodesCount: number = 5): TrackableCollection => ({
  courseId: id,
  courseName: name,
  collectionId: id,
  contentId: id,
  batchId: `batch-${id}`,
  userId: 'user_123',
  addedBy: 'admin_123',
  active: true,
  status: 1,
  completionPercentage: 0,
  progress: 0,
  leafNodesCount: leafNodesCount,
  description: `Desc for ${name}`,
  courseLogoUrl: '',
  dateTime: 1770290316793,
  enrolledDate: 1770290214120,
  batch: {
    identifier: `batch-${id}`,
    batchId: `batch-${id}`,
    name: `Batch for ${name}`,
    startDate: startDate,
    status: 1,
    enrollmentType: 'open',
    createdBy: 'user1'
  },
  content: {
    identifier: id,
    name: name,
    description: `Desc for ${name}`,
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

const mockBatches: TrackableCollection[] = [
  createMockUpcomingBatch('batch1', 'Batch 1', new Date(Date.now() + 86400000).toISOString(), 5),
  createMockUpcomingBatch('batch2', 'Batch 2', '2023-10-15', 3),
  createMockUpcomingBatch('batch3', 'Batch 3', '2023-11-20', 8),
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
        batch: { ...mockBatches[0]!.batch!, startDate: '2023-12-01' },
        completionPercentage: 0
     }));

     render(<MyLearningUpcomingBatches upcomingBatches={manyBatches} />);
     
     // Should only show 10
     const batchItems = screen.getAllByText(/Batch Test/);
     expect(batchItems.length).toBe(10);
  });
});
