import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CollectionOverview from './CollectionOverview';
import type { CollectionData } from '@/types/collectionTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [{ code: 'en', label: 'English' }],
    currentLanguage: { code: 'en', label: 'English' },
    changeLanguage: vi.fn(),
    dir: 'ltr',
  }),
}));

const mockCollectionData: CollectionData = {
  id: 'col-1',
  title: 'Test Course Title',
  lessons: 15,
  image: 'https://example.com/image.png',
  units: 2,
  description: 'A comprehensive course description for testing.',
  audience: ['Student', 'Developer'],
  modules: [
    {
      id: 'mod-1',
      title: 'Introduction Unit',
      subtitle: 'Getting started',
      lessons: [
        { id: 'l1', title: 'Lesson 1', type: 'video' },
        { id: 'l2', title: 'Lesson 2', type: 'document' },
      ],
    },
  ],
};

describe('CollectionOverview', () => {
  it('renders collection image with correct alt text', () => {
    render(<CollectionOverview collectionData={mockCollectionData} />);
    const img = screen.getByRole('img', { name: mockCollectionData.title });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockCollectionData.image);
  });

  it('renders first module title as unit label when modules exist', () => {
    render(<CollectionOverview collectionData={mockCollectionData} />);
    expect(screen.getByText('Introduction Unit')).toBeInTheDocument();
  });

  it('does not render unit label when modules array is empty', () => {
    const dataWithoutModules = { ...mockCollectionData, modules: [] };
    render(<CollectionOverview collectionData={dataWithoutModules} />);
    expect(screen.queryByText('Introduction Unit')).not.toBeInTheDocument();
  });

  it('renders overview section with i18n key', () => {
    render(<CollectionOverview collectionData={mockCollectionData} />);
    expect(screen.getByText('courseDetails.overview')).toBeInTheDocument();
  });

  it('renders units and lessons stats', () => {
    render(<CollectionOverview collectionData={mockCollectionData} />);
    expect(screen.getByText('courseDetails.units')).toBeInTheDocument();
    expect(screen.getByText('contentStats.lessons')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<CollectionOverview collectionData={mockCollectionData} />);
    expect(screen.getByText(mockCollectionData.description)).toBeInTheDocument();
  });

  it('renders best suited for section with all roles', () => {
    render(<CollectionOverview collectionData={mockCollectionData} />);
    expect(screen.getByText('courseDetails.suitedFor')).toBeInTheDocument();
    mockCollectionData.audience.forEach((role) => {
      expect(screen.getByText(role)).toBeInTheDocument();
    });
  });

  it('renders play button', () => {
    render(<CollectionOverview collectionData={mockCollectionData} />);
    const playButton = screen.getByRole('button');
    expect(playButton).toBeInTheDocument();
  });
});
