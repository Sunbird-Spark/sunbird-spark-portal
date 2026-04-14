import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useCertTemplates, useMyImages, useAllImages, useUserCertificates, resolveUserId } from './useCertificate';
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
    searchCertificates: vi.fn(),
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

  // ─── queryFn execution tests ────────────────────────────────────────────────

  describe('useCertTemplates queryFn', () => {
    it('returns empty array when resolveChannel returns null', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
      vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue({ uid: null } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useCertTemplates();
      const result = await (queryParams as any).queryFn();
      expect(result).toEqual([]);
    });

    it('returns mapped templates when service returns content', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user_123');
      vi.mocked(userService.userRead).mockResolvedValue({
        data: { response: { rootOrgId: 'org_abc' } },
      } as any);
      vi.mocked(certificateService.searchCertTemplates).mockResolvedValue({
        data: {
          content: [
            { identifier: 'tmpl-1', name: 'Template A', previewUrl: 'https://t.com/a.png', artifactUrl: 'https://t.com/a.png' },
          ],
        },
      } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useCertTemplates();
      const result = await (queryParams as any).queryFn();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ identifier: 'tmpl-1', name: 'Template A' });
    });

    it('returns empty array when content is missing in response', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user_123');
      vi.mocked(userService.userRead).mockResolvedValue({
        data: { response: { rootOrgId: 'org_abc' } },
      } as any);
      vi.mocked(certificateService.searchCertTemplates).mockResolvedValue({ data: {} } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useCertTemplates();
      const result = await (queryParams as any).queryFn();
      expect(result).toEqual([]);
    });
  });

  describe('useMyImages queryFn', () => {
    it('returns empty array when resolveChannel returns null', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
      vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue({ uid: null } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useMyImages();
      const result = await (queryParams as any).queryFn();
      expect(result).toEqual([]);
    });

    it('returns mapped images when service returns content', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user_123');
      vi.mocked(userService.userRead).mockResolvedValue({
        data: { response: { rootOrgId: 'org_abc' } },
      } as any);
      vi.mocked(certificateService.searchLogos).mockResolvedValue({
        data: { content: [{ identifier: 'img-1', name: 'Logo', artifactUrl: 'https://img.com/logo.png' }] },
      } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useMyImages();
      const result = await (queryParams as any).queryFn();

      expect(certificateService.searchLogos).toHaveBeenCalledWith('org_abc', 'user_123');
      expect(result).toEqual([{ identifier: 'img-1', name: 'Logo', url: 'https://img.com/logo.png' }]);
    });
  });

  describe('useAllImages queryFn', () => {
    it('returns empty array when resolveChannel returns null', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
      vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue({ uid: null } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useAllImages();
      const result = await (queryParams as any).queryFn();
      expect(result).toEqual([]);
    });

    it('calls searchLogos without userId for all images', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user_123');
      vi.mocked(userService.userRead).mockResolvedValue({
        data: { response: { rootOrgId: 'org_abc' } },
      } as any);
      vi.mocked(certificateService.searchLogos).mockResolvedValue({
        data: { content: [] },
      } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useAllImages();
      await (queryParams as any).queryFn();

      expect(certificateService.searchLogos).toHaveBeenCalledWith('org_abc');
    });
  });

  describe('useUserCertificates', () => {
    it('sets up userCertificates query correctly', () => {
      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useUserCertificates();

      expect(useQuery).toHaveBeenCalled();
      expect((queryParams as any).queryKey).toEqual(['userCertificates']);
      expect((queryParams as any).staleTime).toBe(5 * 60 * 1000);
    });

    it('queryFn uses userId from getUserId and calls searchCertificates', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user_123');
      vi.mocked(certificateService.searchCertificates).mockResolvedValue({ data: {} } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useUserCertificates();
      await (queryParams as any).queryFn();

      expect(certificateService.searchCertificates).toHaveBeenCalledWith('user_123');
    });

    it('queryFn falls back to getAuthInfo when getUserId returns null', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
      vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue({ uid: 'auth_user' } as any);
      vi.mocked(certificateService.searchCertificates).mockResolvedValue({ data: {} } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useUserCertificates();
      await (queryParams as any).queryFn();

      expect(certificateService.searchCertificates).toHaveBeenCalledWith('auth_user');
    });

    it('queryFn throws when userId is null after auth check', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
      vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue({ uid: null } as any);

      (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);
      const queryParams = useUserCertificates();

      await expect((queryParams as any).queryFn()).rejects.toThrow('User not authenticated');
    });
  });
});
