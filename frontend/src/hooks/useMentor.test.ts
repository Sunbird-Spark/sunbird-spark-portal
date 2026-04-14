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

    describe('queryFn', () => {
      let queryFn: () => Promise<any>;

      beforeEach(() => {
        (useQuery as import('vitest').Mock).mockImplementation((opts) => {
          queryFn = opts.queryFn;
          return opts;
        });
        useMentorList();
      });

      it('returns empty array if no user ID could be resolved', async () => {
        (userAuthInfoService.getUserId as any).mockReturnValue(null);
        (userAuthInfoService.getAuthInfo as any).mockResolvedValue(null);

        const result = await queryFn();
        expect(result).toEqual([]);
      });

      it('resolves user ID from getAuthInfo if getUserId returns null', async () => {
        (userAuthInfoService.getUserId as any).mockReturnValue(null);
        (userAuthInfoService.getAuthInfo as any).mockResolvedValue({ uid: 'auth-uid' });
        
        (userService.userRead as any).mockResolvedValue({ data: { response: { rootOrgId: 'org-123' } } });
        (userService.searchMentors as any).mockResolvedValue({ data: { response: { content: [] } } });

        await queryFn();
        expect(userService.userRead).toHaveBeenCalledWith('auth-uid');
      });

      it('returns empty array if rootOrgId is missing in user profile', async () => {
        (userAuthInfoService.getUserId as any).mockReturnValue('user-123');
        (userService.userRead as any).mockResolvedValue({ data: { response: { /* no rootOrgId */ } } });

        const result = await queryFn();
        expect(result).toEqual([]);
        expect(userService.searchMentors).not.toHaveBeenCalled();
      });

      it('returns mapped mentors on successful fetch', async () => {
        (userAuthInfoService.getUserId as any).mockReturnValue('user-123');
        (userService.userRead as any).mockResolvedValue({ data: { response: { rootOrgId: 'org-123' } } });
        
        (userService.searchMentors as any).mockResolvedValue({
          data: {
            response: {
              content: [
                {
                  identifier: 'mentor-1',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@example.com',
                  maskedEmail: 'j***@example.com'
                },
                {
                  userId: 'mentor-2', // Falls back to identifier
                  firstName: 'Jane',
                }
              ]
            }
          }
        });

        const result = await queryFn();
        
        expect(userService.searchMentors).toHaveBeenCalledWith('org-123');
        expect(result).toEqual([
          {
            identifier: 'mentor-1',
            userId: 'mentor-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            maskedEmail: 'j***@example.com'
          },
          {
            identifier: 'mentor-2',
            userId: 'mentor-2',
            firstName: 'Jane',
            lastName: undefined,
            email: undefined,
            maskedEmail: undefined
          }
        ]);
      });

      it('returns empty array when searchMentors API has no content', async () => {
        (userAuthInfoService.getUserId as any).mockReturnValue('user-123');
        (userService.userRead as any).mockResolvedValue({ data: { response: { rootOrgId: 'org-123' } } });
        (userService.searchMentors as any).mockResolvedValue({}); // Missing response.content

        const result = await queryFn();
        expect(result).toEqual([]);
      });
    });
  });
});
