import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBatchListForCreator, useBatchListForLearner, useBatchRead, useContentState, useEnrol, useCreateBatch, useUpdateBatch } from './useBatch';
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

vi.mock('../services/collection/BatchService', () => ({
  BatchService: class {
    batchList = vi.fn();
    batchRead = vi.fn();
    contentStateRead = vi.fn();
    enrol = vi.fn();
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
      expect((queryParams as any).queryKey).toEqual(['batchList', 'course_123', true]);
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
