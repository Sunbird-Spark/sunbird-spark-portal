import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCertTemplates, useMyImages, useAllImages, resolveUserId } from './useCertificate';
import { certificateService } from '../services/CertificateService';
import { userService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

// Mock tanstack query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}));

// Mock services
vi.mock('../services/CertificateService', () => ({
  certificateService: {
    searchCertTemplates: vi.fn(),
    searchLogos: vi.fn(),
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

describe('useCertificate hooks test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveUserId', () => {
    it('returns userId from getUserId', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user_123');
      const id = await resolveUserId();
      expect(id).toBe('user_123');
    });

    it('falls back to getAuthInfo if getUserId returns null', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(undefined as any);
      vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue({ uid: 'auth_user_123' } as any);
      const id = await resolveUserId();
      expect(id).toBe('auth_user_123');
    });
  });

  describe('useCertTemplates', () => {
    it('sets up certTemplates query correctly', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useCertTemplates();
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['certTemplates']);
      expect((queryParams as any).staleTime).toBe(2 * 60 * 1000);
    });
  });

  describe('useMyImages', () => {
    it('sets up myImages query correctly', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useMyImages();
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['myImages']);
      expect((queryParams as any).staleTime).toBe(2 * 60 * 1000);
    });
  });

  describe('useAllImages', () => {
    it('sets up allImages query correctly', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useAllImages();
      
      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['allImages']);
      expect((queryParams as any).staleTime).toBe(2 * 60 * 1000);
    });
  });
});
