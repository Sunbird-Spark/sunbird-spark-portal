import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CollectionOverview from './CollectionOverview';
import { collectionData } from '@/data/collectionData';

// Mock the i18n hook
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('CollectionOverview', () => {
  it('renders correctly with collection data', () => {
    render(<CollectionOverview collectionData={collectionData} />);

    // Check for title in image alt
    expect(screen.getByAltText(collectionData.title)).toBeInTheDocument();

    // Check for overview title
    expect(screen.getByText('courseDetails.overview')).toBeInTheDocument();

    // Check for description
    expect(screen.getByText(collectionData.description)).toBeInTheDocument();

    // Check for stats
    expect(screen.getByText(collectionData.weeks.toString())).toBeInTheDocument();
    expect(screen.getByText('courseDetails.weeks')).toBeInTheDocument();
    expect(screen.getByText(collectionData.lessons.toString())).toBeInTheDocument();
    expect(screen.getByText('contentStats.lessons')).toBeInTheDocument();
  });

  it('renders skills and suitability sections', () => {
    render(<CollectionOverview collectionData={collectionData} />);

    expect(screen.getByText('courseDetails.skills')).toBeInTheDocument();
    expect(screen.getByText('courseDetails.suitedFor')).toBeInTheDocument();

    // Check for at least one skill and one suitability role
    // Using getAllByText since "Business Analyst" is duplicated in collectionData
    expect(screen.getByText(collectionData.skills[0]!)).toBeInTheDocument();
    expect(screen.getAllByText(collectionData.bestSuitedFor[0]!)[0]).toBeInTheDocument();
  });
});
