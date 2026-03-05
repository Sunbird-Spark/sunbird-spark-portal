import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInitialCollectionContentNavigation } from './useInitialCollectionContentNavigation';
import type { CollectionData } from '@/types/collectionTypes';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const COLLECTION_MIME = 'application/vnd.ekstep.content-collection';

function makeCollectionData(overrides?: Partial<CollectionData>): CollectionData {
  return {
    id: 'col-1',
    title: 'Course',
    lessons: 2,
    image: '',
    units: 1,
    description: '',
    audience: [],
    children: [],
    hierarchyRoot: {
      identifier: 'col-1',
      mimeType: COLLECTION_MIME,
      children: [
        {
          identifier: 'unit-1',
          mimeType: COLLECTION_MIME,
          children: [
            { identifier: 'l1', mimeType: 'video/mp4' },
            { identifier: 'l2', mimeType: 'application/pdf' },
          ],
        },
      ],
    },
    ...overrides,
  };
}

function makeTwoUnitHierarchy(): CollectionData['hierarchyRoot'] {
  return {
    identifier: 'col-1',
    mimeType: COLLECTION_MIME,
    children: [
      {
        identifier: 'unit-1',
        mimeType: COLLECTION_MIME,
        children: [
          { identifier: 'l1', mimeType: 'video/mp4' },
          { identifier: 'l2', mimeType: 'application/pdf' },
        ],
      },
      {
        identifier: 'unit-2',
        mimeType: COLLECTION_MIME,
        children: [
          { identifier: 'l3', mimeType: 'video/mp4' },
          { identifier: 'l4', mimeType: 'application/pdf' },
        ],
      },
    ],
  };
}

const defaultParams = {
  collectionData: makeCollectionData() as CollectionData | null,
  contentId: undefined as string | undefined,
  isTrackable: true,
  contentCreatorPrivilege: false,
  collectionId: 'col-1',
  hasBatchInRoute: true,
  batchIdParam: 'batch-1',
  isEnrolledInCurrentBatch: true,
  contentStatusMap: { l1: 0, l2: 0 } as Record<string, number>,
  contentStateFetched: true,
};

describe('useInitialCollectionContentNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not navigate when collectionData is null', () => {
    renderHook(() =>
      useInitialCollectionContentNavigation({
        ...defaultParams,
        collectionData: null,
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when contentId is already in URL', () => {
    renderHook(() =>
      useInitialCollectionContentNavigation({
        ...defaultParams,
        contentId: 'l1',
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  describe('non-trackable or content creator', () => {
    it('navigates to first leaf when not trackable and no contentId', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          isTrackable: false,
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-1/content/l1', { replace: true });
    });

    it('navigates to first leaf when contentCreatorPrivilege and no contentId', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          contentCreatorPrivilege: true,
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-1/content/l1', { replace: true });
    });

    it('does not navigate when collectionId is missing', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          isTrackable: false,
          collectionId: undefined,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('learner view (trackable, enrolled)', () => {
    it('does not navigate when hasBatchInRoute is false', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          hasBatchInRoute: false,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when batchIdParam is missing', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          batchIdParam: undefined,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when not enrolled in current batch', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          isEnrolledInCurrentBatch: false,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when contentStatusMap is missing', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          contentStatusMap: undefined,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate when contentStateFetched is false (wait for content state before first-unconsumed)', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          contentStateFetched: false,
        }),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to first unconsumed content (status not 2)', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          contentStatusMap: { l1: 2, l2: 0 },
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-1/batch/batch-1/content/l2', {
        replace: true,
      });
    });

    it('navigates to first leaf when all contents are completed (status 2)', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          contentStatusMap: { l1: 2, l2: 2 },
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-1/batch/batch-1/content/l1', {
        replace: true,
      });
    });

    it('navigates to first unconsumed in whole course when unit 1 all completed (two units)', () => {
      const collectionData = makeCollectionData({
        hierarchyRoot: makeTwoUnitHierarchy(),
      });
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          collectionData,
          contentStatusMap: { l1: 2, l2: 2 },
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-1/batch/batch-1/content/l3', {
        replace: true,
      });
    });

    it('treats content missing from contentStatusMap as unconsumed', () => {
      renderHook(() =>
        useInitialCollectionContentNavigation({
          ...defaultParams,
          contentStatusMap: { l1: 2 },
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/collection/col-1/batch/batch-1/content/l2', {
        replace: true,
      });
    });
  });
});
