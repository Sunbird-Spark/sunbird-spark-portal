import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useMentorList } from './useMentor';
import { userService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

// Mock tanstack query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

// Mock services
vi.mock('../services/UserService', () => ({
  userService: {
    userRead: vi.fn(),
    searchMentors: vi.fn(),
  }
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(),
    getAuthInfo: vi.fn()
  }
}));

describe('useMentor hooks test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMentorList', () => {
    it('sets up mentorList query correctly', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useMentorList();
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['mentorList']);
      expect((queryParams as any).staleTime).toBe(5 * 60 * 1000); // 5 minutes
    });
  });
});
