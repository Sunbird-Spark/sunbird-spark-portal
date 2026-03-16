import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCollectionEnrollment } from './useCollectionEnrollment';
import type { CollectionData } from '../types/collectionTypes';
import dayjs from 'dayjs';

const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
const mockRefetchEnrollments = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

const mockUseBatchRead = vi.fn();
vi.mock('./useBatch', () => ({
  useBatchListForLearner: () => ({ data: null, isLoading: false, error: null }),
  useBatchListForMentor: () => ({ data: null, isLoading: false, error: null }),
  useBatchRead: (batchId: string | undefined, _opts: { enabled?: boolean }) => mockUseBatchRead(batchId),
  useContentState: () => ({ data: { contentList: [] } }),
  useEnrol: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock('./useUser', () => ({
  useIsMentor: () => false,
}));

vi.mock('./useUserEnrolledCollections', () => ({
  useUserEnrolledCollections: () => ({
    data: {
      courses: [{ courseId: 'col_1', batchId: 'batch_1', contentId: 'col_1' }],
    },
    refetch: mockRefetchEnrollments,
  }),
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: { getUserId: () => 'user_1' },
}));

const minimalCollectionChildren = [
  {
    identifier: 'mod_1',
    name: '',
    primaryCategory: '',
    mimeType: 'application/vnd.ekstep.content-collection',
    children: [{ identifier: 'leaf_1', name: '', mimeType: 'video/mp4' }],
  },
];

const minimalCollectionData: CollectionData = {
  id: 'col_1',
  title: '',
  lessons: 1,
  image: '',
  units: 1,
  description: '',
  audience: [],
  children: minimalCollectionChildren,
  hierarchyRoot: {
    identifier: 'col_1',
    mimeType: 'application/vnd.ekstep.content-collection',
    children: minimalCollectionChildren,
  },
};

describe('useCollectionEnrollment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBatchRead.mockReturnValue({ data: undefined });
  });

  describe('isBatchEnded', () => {
    it('is false when batch read response has no endDate', () => {
      mockUseBatchRead.mockReturnValue({ data: { data: { response: {} } } });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchEnded).toBe(false);
    });

    it('is false when batch read response is undefined', () => {
      mockUseBatchRead.mockReturnValue({ data: undefined });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchEnded).toBe(false);
    });

    it('is true when batch endDate is in the past', () => {
      const pastDate = '2020-01-01T00:00:00.000Z';
      mockUseBatchRead.mockReturnValue({
        data: { data: { response: { endDate: pastDate } } },
      });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchEnded).toBe(true);
    });

    it('is false when batch endDate is in the future', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      mockUseBatchRead.mockReturnValue({
        data: { data: { response: { endDate: futureDate } } },
      });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchEnded).toBe(false);
    });

    it('is false when batch endDate is invalid', () => {
      mockUseBatchRead.mockReturnValue({
        data: { data: { response: { endDate: 'not-a-valid-date' } } },
      });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchEnded).toBe(false);
    });
  });

  describe('isBatchUpcoming', () => {
    const FIXED_NOW = new Date('2025-06-15T12:00:00');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('is false when batch read response has no startDate', () => {
      mockUseBatchRead.mockReturnValue({ data: { data: { response: {} } } });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchUpcoming).toBe(false);
    });

    it('is false when batch read response is undefined', () => {
      mockUseBatchRead.mockReturnValue({ data: undefined });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchUpcoming).toBe(false);
    });

    it('is true when batch startDate is in the future (date-only string)', () => {
      const futureDate = '2099-01-01';
      mockUseBatchRead.mockReturnValue({
        data: { data: { response: { startDate: futureDate } } },
      });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchUpcoming).toBe(true);
    });

    it('is true when batch startDate is in the future (UTC datetime)', () => {
      const futureDate = '2099-01-01T00:00:00.000Z';
      mockUseBatchRead.mockReturnValue({
        data: { data: { response: { startDate: futureDate } } },
      });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchUpcoming).toBe(true);
    });

    it('is false when batch startDate is today or in the past', () => {
      const today = dayjs().format('YYYY-MM-DD');
      mockUseBatchRead.mockReturnValue({
        data: { data: { response: { startDate: today } } },
      });
      const { result } = renderHook(() =>
        useCollectionEnrollment('col_1', 'batch_1', minimalCollectionData, true)
      );
      expect(result.current.isBatchUpcoming).toBe(false);
    });
  });
});
