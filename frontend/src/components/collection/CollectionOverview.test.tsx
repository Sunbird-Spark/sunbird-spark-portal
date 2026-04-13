import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  default: ({ message, error, onRetry }: { message?: string; error?: string; onRetry?: () => void }) => (
    <div data-testid="page-loader" data-error={error ?? ''}>
      {message || error}
      {onRetry && <button data-testid="retry-btn" onClick={onRetry}>Retry</button>}
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
  children: [
    {
      identifier: 'mod-1',
      name: 'Introduction Unit',
      primaryCategory: 'Getting started',
      mimeType: 'application/vnd.ekstep.content-collection',
      children: [
        { identifier: 'l1', name: 'Lesson 1', mimeType: 'video/mp4' },
        { identifier: 'l2', name: 'Lesson 2', mimeType: 'application/pdf' },
      ],
    },
  ],
  hierarchyRoot: {
    identifier: 'col-1',
    mimeType: 'application/vnd.ekstep.content-collection',
    children: [
      {
        identifier: 'mod-1',
        name: 'Introduction Unit',
        primaryCategory: 'Getting started',
        mimeType: 'application/vnd.ekstep.content-collection',
        children: [
          { identifier: 'l1', name: 'Lesson 1', mimeType: 'video/mp4' },
          { identifier: 'l2', name: 'Lesson 2', mimeType: 'application/pdf' },
        ],
      },
    ],
  },
};

const mockPlayerMetadata = {
  identifier: 'content-1',
  name: 'Test Video',
  mimeType: 'video/mp4',
  artifactUrl: 'https://example.com/video.mp4',
};

describe('CollectionOverview', () => {
  describe('player area — when contentAccessBlocked is true', () => {
    it('shows mustJoinToAccessContent message and no PageLoader or ContentPlayer', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentAccessBlocked={true}
        />
      );
      expect(screen.getByText('courseDetails.mustJoinToAccessContent')).toBeInTheDocument();
      expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
    });

    it('shows mustJoinToAccessContent even when contentId is provided', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentId="content-1"
          contentAccessBlocked={true}
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.mustJoinToAccessContent')).toBeInTheDocument();
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
    });
  });

  describe('player area — when upcomingBatchBlocked is true', () => {
    it('shows batchNotStartedYet message and no PageLoader or ContentPlayer', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentAccessBlocked={false}
          upcomingBatchBlocked={true}
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.batchNotStartedYetNoDate')).toBeInTheDocument();
      expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
      expect(screen.queryByTestId('content-player')).not.toBeInTheDocument();
    });

    it('shows batchNotStartedYet with date when batchStartDate is provided (line 61 true branch)', () => {
      render(
        <CollectionOverview
          collectionData={mockCollectionData}
          contentAccessBlocked={false}
          upcomingBatchBlocked={true}
          batchStartDate="2025-06-01"
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.batchNotStartedYet')).toBeInTheDocument();
    });
  });

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
    it('renders "Course Overview" heading when primaryCategory is Course', () => {
      render(
        <CollectionOverview
          collectionData={{ ...mockCollectionData, primaryCategory: 'Course' }}
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.overview')).toBeInTheDocument();
    });

    it('renders generic "Overview" heading when primaryCategory is not Course', () => {
      render(
        <CollectionOverview
          collectionData={{ ...mockCollectionData, primaryCategory: 'Digital Textbook' }}
          contentId="content-1"
          playerMetadata={mockPlayerMetadata}
        />
      );
      expect(screen.getByText('courseDetails.collectionOverview')).toBeInTheDocument();
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
      expect(screen.getByText('courseDetails.collectionOverview')).toBeInTheDocument();
      expect(screen.getByText(mockCollectionData.description)).toBeInTheDocument();
    });
  });

  describe('retry button (line 110)', () => {
    it('calls window.location.reload when retry button is clicked in no-contentId error state', () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadMock },
        writable: true,
      });

      render(<CollectionOverview collectionData={mockCollectionData} />);

      const retryBtn = screen.getByTestId('retry-btn');
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  it('shows 0 units when collectionData.children is undefined (line 133 ?? 0 branch)', () => {
    const dataNoChildren = { ...mockCollectionData, children: undefined };
    render(<CollectionOverview collectionData={dataNoChildren as any} />);
    // The children stat should display 0
    const statValues = document.querySelectorAll('.collection-stat-value');
    expect(statValues[0]?.textContent).toBe('0');
  });
});
