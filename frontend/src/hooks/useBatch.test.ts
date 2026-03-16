import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBatchListForCreator, useBatchListForMentor, useBatchListForLearner, useBatchRead, useContentState, useEnrol, useUnenrol, useCreateBatch, useUpdateBatch } from './useBatch';
import { batchService as creatorBatchService } from '../services/BatchService';
import { BatchService as LearnerBatchService } from '../services/collection/BatchService';
import { userService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

// Mock tanstack query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

// Mock services
vi.mock('../services/BatchService', () => ({
  batchService: {
    listBatches: vi.fn(),
    createBatch: vi.fn(),
    updateBatch: vi.fn(),
  }
}));

const learnerBatchServiceMethods = vi.hoisted(() => ({
  batchList: vi.fn(),
  batchRead: vi.fn(),
  contentStateRead: vi.fn(),
  enrol: vi.fn(),
  unenrol: vi.fn(),
}));

vi.mock('../services/collection/BatchService', () => ({
  BatchService: class {
    constructor() {
      Object.assign(this, learnerBatchServiceMethods);
    }
  }
}));

vi.mock('../services/UserService', () => ({
  userService: {
    userRead: vi.fn(),
  }
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(),
    getAuthInfo: vi.fn()
  }
}));

vi.mock('./useAuthInfo', () => ({
  useAuthInfo: vi.fn(() => ({
    data: { uid: 'user_123', sid: 'session_123', isAuthenticated: true },
    isLoading: false,
    error: null,
  })),
}));

describe('useBatch hooks test', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQueryClient as import('vitest').Mock).mockReturnValue(mockQueryClient);
  });

  describe('useBatchListForLearner', () => {
    it('sets up generic learner batch list query', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useBatchListForLearner('course_123');
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['batchList', 'course_123', false]);
      expect((queryParams as any).enabled).toBe(true);
    });
  });

  describe('useBatchListForCreator', () => {
    it('sets up creator batch list query with correct staleTime', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useBatchListForCreator('course_123');
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['batchList', 'course_123', true, 'user_123']);
      expect((queryParams as any).staleTime).toBe(0);
      expect((queryParams as any).retry).toBe(1);
    });
  });

  describe('useBatchListForMentor', () => {
    it('sets up mentor batch list query with correct staleTime and queryKey', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useBatchListForMentor('course_123');
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['batchList', 'course_123', 'mentor']);
      expect((queryParams as any).staleTime).toBe(0);
      expect((queryParams as any).retry).toBe(1);
    });
  });

  describe('useBatchRead', () => {
    it('sets up batchRead query correctly', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useBatchRead('batch_123');
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['batchRead', 'batch_123']);
      expect((queryParams as any).enabled).toBe(true);
    });
  });

  describe('useContentState', () => {
    it('sets up contentState query correctly when request is valid', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const req = { userId: 'u1', courseId: 'c1', batchId: 'b1', contentIds: ['doc1'] };
      const queryParams = useContentState(req);
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['contentState', 'u1', 'c1', 'b1', 'doc1', '']);
      expect((queryParams as any).enabled).toBe(true);
    });

    it('disables query if contentIds is missing/empty', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const req = { userId: 'u1', courseId: 'c1', batchId: 'b1', contentIds: [] };
      const queryParams = useContentState(req);
      
      expect((queryParams as any).enabled).toBe(false);
    });
  });

  describe('useEnrol', () => {
    it('sets up enrol mutation', () => {
      (useMutation as import('vitest').Mock).mockImplementation((opts) => opts);
      const mutationParams = useEnrol();

      expect(useMutation).toHaveBeenCalled();
      expect(typeof (mutationParams as any).mutationFn).toBe('function');
    });
  });

  describe('useUnenrol', () => {
    it('sets up unenrol mutation', () => {
      (useMutation as import('vitest').Mock).mockImplementation((opts) => opts);
      const mutationParams = useUnenrol();

      expect(useMutation).toHaveBeenCalled();
      expect(typeof (mutationParams as any).mutationFn).toBe('function');
    });

    it('wires mutationFn to learnerBatchService.unenrol with courseId, userId, batchId', async () => {
      learnerBatchServiceMethods.unenrol.mockResolvedValue({ data: {}, status: 200, headers: {} });
      (useMutation as import('vitest').Mock).mockImplementation((opts) => opts);

      const mutationParams = useUnenrol();
      await (mutationParams as any).mutationFn({ courseId: 'c1', userId: 'u1', batchId: 'b1' });

      expect(learnerBatchServiceMethods.unenrol).toHaveBeenCalledWith('c1', 'u1', 'b1');
    });
  });

  describe('useCreateBatch', () => {
    it('sets up create batch mutation with onSuccess invalidation', () => {
      (useMutation as import('vitest').Mock).mockImplementation((opts) => opts);
      const mutationParams = useCreateBatch();
      
      expect(useMutation).toHaveBeenCalled();
      expect(typeof (mutationParams as any).onSuccess).toBe('function');

      vi.useFakeTimers();
      // call onSuccess (requires a dummy response and variables to satisfy signature)
      (mutationParams as any).onSuccess({ data: { batchId: 'b1' } }, { courseId: 'course_123' });
      
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ['batchList', 'course_123', true],
        expect.any(Function)
      );

      vi.advanceTimersByTime(2000);
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['batchList', 'course_123', true]
      });
      vi.useRealTimers();
    });
  });

  describe('useUpdateBatch', () => {
    it('sets up update batch mutation with onSuccess invalidation', () => {
      (useMutation as import('vitest').Mock).mockImplementation((opts) => opts);
      const mutationParams = useUpdateBatch();
      
      expect(useMutation).toHaveBeenCalled();
      expect(typeof (mutationParams as any).onSuccess).toBe('function');

      vi.useFakeTimers();
      // Call onSuccess to verify it invalidates
      (mutationParams as any).onSuccess(null, { courseId: 'course_123', batchId: 'b2' });
      
      expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
        ['batchList', 'course_123', true],
        expect.any(Function)
      );

      vi.advanceTimersByTime(2000);
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['batchList', 'course_123', true]
      });
      vi.useRealTimers();
    });
  });
});
