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

vi.mock('@/components/players', () => ({
  ContentPlayer: ({ mimeType }: { mimeType: string }) => (
    <div data-testid="content-player" data-mime-type={mimeType}>Content Player</div>
  ),
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message, error }: { message?: string; error?: string }) => (
    <div data-testid="page-loader" data-error={error ?? ''}>
      {message || error}
    </div>
  ),
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

const mockPlayerMetadata = {
  identifier: 'content-1',
  name: 'Test Video',
  mimeType: 'video/mp4',
  artifactUrl: 'https://example.com/video.mp4',
};

describe('CollectionOverview', () => {
  describe('player area — when no contentId is provided', () => {
    it('shows error PageLoader when contentId is absent', () => {
      render(<CollectionOverview collectionData={mockCollectionData} />);
      const loader = screen.getByTestId('page-loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-error', 'noContentFound');
    });

    it('does not render ContentPlayer when contentId is absent', () => {
      render(<CollectionOverview collectionData={mockCollectionData} />);
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
    });
  });

  describe('player area — when contentId is provided', () => {
    it('shows loading PageLoader when playerIsLoading is true', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerIsLoading={true}
        />
      );
      const loader = screen.getByTestId('page-loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveTextContent('loading');
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
    });

    it('shows error message when playerError is set', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerIsLoading={false}
          playerError={new Error('Failed to load content')}
        />
      );
      expect(screen.getByText('Failed to load content')).toBeInTheDocument();
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
    });

    it('renders ContentPlayer with correct mimeType when playerMetadata is available', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerIsLoading={false}
          playerMetadata={mockPlayerMetadata}
        />
      );
      const player = screen.getByTestId('content-player');
      expect(player).toBeInTheDocument();
      expect(player).toHaveAttribute('data-mime-type', 'video/mp4');
    });

    it('does not render ContentPlayer when playerMetadata is undefined', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerIsLoading={false}
          playerMetadata={undefined}
        />
      );
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
    });

    it('does not render ContentPlayer while loading even if stale metadata is present', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerIsLoading={true}
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
      expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    });
  });

  // Course overview section is always visible regardless of contentId / player state
  describe('course overview section', () => {
    it('renders overview heading', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.overview')).toBeInTheDocument();
    });

    it('renders units and lessons stats', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.units')).toBeInTheDocument();
      expect(screen.getByText('contentStats.lessons')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText(mockCollectionData.description)).toBeInTheDocument();
    });

    it('renders best suited for section with all audience roles', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.suitedFor')).toBeInTheDocument();
      mockCollectionData.audience.forEach((role) => {
        expect(screen.getByText(role)).toBeInTheDocument();
      });
    });

    it('renders overview section even when no contentId is provided', () => {
      render(<CollectionOverview collectionData={mockCollectionData} />);
      expect(screen.getByText('courseDetails.overview')).toBeInTheDocument();
      expect(screen.getByText(mockCollectionData.description)).toBeInTheDocument();
    });
  });
});
