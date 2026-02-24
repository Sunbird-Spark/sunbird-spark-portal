import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCollectionEnrollment } from './useCollectionEnrollment';
import type { CollectionData } from '../types/collectionTypes';

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
  useBatchRead: (batchId: string | undefined, _opts: { enabled?: boolean }) => mockUseBatchRead(batchId),
  useContentState: () => ({ data: { contentList: [] } }),
  useEnrol: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
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

const minimalCollectionData: CollectionData = {
  id: 'col_1',
  title: '',
  lessons: 1,
  image: '',
  units: 1,
  description: '',
  audience: [],
  modules: [
    {
      id: 'mod_1',
      title: '',
      subtitle: '',
      lessons: [{ id: 'leaf_1', title: '', type: 'video' }],
    },
  ],
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
});
