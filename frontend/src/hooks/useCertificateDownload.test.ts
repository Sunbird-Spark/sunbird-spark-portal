import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCertificateDownload } from './useCertificateDownload';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { certificateService } from '@/services/CertificateService';
import { convertSvgToOutput } from '@/utils/svg-converter';
import { IssuedCertificate } from '@/types/TrackableCollections';

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(),
    getAuthInfo: vi.fn(),
  },
}));

vi.mock('@/services/CertificateService', () => ({
  certificateService: {
    searchCertificates: vi.fn(),
    downloadCertificate: vi.fn(),
  },
}));

vi.mock('@/utils/svg-converter', () => ({
  convertSvgToOutput: vi.fn(),
}));

vi.stubGlobal('fetch', vi.fn());

describe('useCertificateDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useCertificateDownload());

    expect(result.current.downloadingCourseId).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoadingCerts).toBe(false);
  });

  it('returns hasCertificate function', () => {
    const { result } = renderHook(() => useCertificateDownload());

    const mockCert: IssuedCertificate = {
      identifier: 'cert-123',
      lastIssuedOn: '2024-01-01',
      name: 'Test Certificate',
      templateUrl: 'http://example.com/template.svg',
      token: 'token-123',
      type: 'course',
    };

    expect(result.current.hasCertificate('course-1', 'batch-1', 'Course Name', [mockCert])).toBe(true);
    expect(result.current.hasCertificate('course-1', 'batch-1', 'Course Name', [])).toBe(false);
  });

  it('sets error when user not found', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
    vi.mocked(userAuthInfoService.getAuthInfo).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useCertificateDownload());

    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course Name');
    });

    expect(result.current.error).toBe('User not found');
  });

  it('downloads certificate from issued certificates', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(convertSvgToOutput).mockResolvedValue(undefined);
    vi.mocked(certificateService.downloadCertificate).mockResolvedValue({
      data: '<svg></svg>',
      status: 200,
      headers: {},
    });

    const mockCert: IssuedCertificate = {
      identifier: 'cert-123',
      lastIssuedOn: '2024-01-01',
      name: 'Test Certificate',
      templateUrl: 'http://example.com/template.svg',
      token: 'token-123',
      type: 'course',
    };

    const { result } = renderHook(() => useCertificateDownload());

    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course Name', [mockCert]);
    });

    expect(result.current.downloadingCourseId).toBeNull();
    expect(result.current.error).toBeNull();
    expect(certificateService.downloadCertificate).toHaveBeenCalledWith('cert-123', 'http://example.com/template.svg');
    expect(convertSvgToOutput).toHaveBeenCalled();
  });

  it('searches RC registry when no issued certificate found', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(certificateService.searchCertificates).mockResolvedValue({
      data: [
        {
          osid: 'rc-cert-123',
          osUpdatedAt: '2024-01-01',
          osCreatedAt: '2024-01-01',
          recipient: { id: 'user-123', name: 'Test User' },
          issuer: { url: 'https://example.com', name: 'Example Org' },
          training: { id: 'course-1', name: 'Test Course', type: 'course', batchId: 'batch-1' },
          templateUrl: 'http://example.com/template.svg',
          status: 'active',
          certificateLabel: 'Certificate',
        },
      ] as any,
      status: 200,
      headers: {},
    });
    vi.mocked(certificateService.downloadCertificate).mockResolvedValue({
      data: '<svg></svg>',
      status: 200,
      headers: {},
    });
    vi.mocked(convertSvgToOutput).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCertificateDownload());

    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course Name');
    });

    expect(certificateService.searchCertificates).toHaveBeenCalledWith('user-123');
    expect(result.current.error).toBeNull();
  });

  it('sets error when certificate not found', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(certificateService.searchCertificates).mockResolvedValue({ data: [], status: 200, headers: {} });

    const { result } = renderHook(() => useCertificateDownload());

    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course Name');
    });

    expect(result.current.error).toBe('Certificate is not yet generated or available for this course.');
  });

  it('handles fetch error for certificate metadata', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(certificateService.downloadCertificate).mockRejectedValue(new Error('Failed to fetch certificate'));

    const mockCert: IssuedCertificate = {
      identifier: 'cert-123',
      lastIssuedOn: '2024-01-01',
      name: 'Test Certificate',
      templateUrl: 'http://example.com/template.svg',
      token: 'token-123',
      type: 'course',
    };

    const { result } = renderHook(() => useCertificateDownload());

    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course Name', [mockCert]);
    });

    expect(result.current.error).toContain('Failed to fetch certificate');
  });

  it('handles empty SVG content', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(certificateService.downloadCertificate).mockResolvedValue({
      data: '   ',
      status: 200,
      headers: {},
    });

    const mockCert: IssuedCertificate = {
      identifier: 'cert-123',
      lastIssuedOn: '2024-01-01',
      name: 'Test Certificate',
      templateUrl: 'http://example.com/template.svg',
      token: 'token-123',
      type: 'course',
    };

    const { result } = renderHook(() => useCertificateDownload());

    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course Name', [mockCert]);
    });

    expect(result.current.error).toBe('No certificate SVG received from server.');
  });

  it('falls back to token when identifier is absent (line 39 || token branch)', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(convertSvgToOutput).mockResolvedValue(undefined);
    vi.mocked(certificateService.downloadCertificate).mockResolvedValue({
      data: '<svg>cert</svg>',
      status: 200,
      headers: {},
    });

    const certWithToken: IssuedCertificate = {
      identifier: '',  // no identifier
      lastIssuedOn: '2024-01-01',
      name: 'Test',
      templateUrl: 'http://example.com/template.svg',
      token: 'token-fallback',  // only token available
      type: 'course',
    };

    const { result } = renderHook(() => useCertificateDownload());
    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course', [certWithToken]);
    });
    // Uses token-fallback as certId
    expect(certificateService.downloadCertificate).toHaveBeenCalledWith('token-fallback', expect.anything());
    expect(result.current.error).toBeNull();
  });

  it('falls back to empty array when searchResponse.data is not an array (line 45 false branch)', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(certificateService.searchCertificates).mockResolvedValue({
      data: 'not-an-array' as any,
      status: 200,
      headers: {},
    });

    const { result } = renderHook(() => useCertificateDownload());
    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course');
    });
    expect(result.current.error).toBe('Certificate is not yet generated or available for this course.');
  });

  it('uses "certificate" as filename when courseName is empty (line 66 || branch)', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(convertSvgToOutput).mockResolvedValue(undefined);
    vi.mocked(certificateService.downloadCertificate).mockResolvedValue({
      data: '<svg>cert</svg>',
      status: 200,
      headers: {},
    });

    const cert: IssuedCertificate = {
      identifier: 'cert-id',
      lastIssuedOn: '2024-01-01',
      name: 'Test',
      templateUrl: 'http://example.com/template.svg',
      token: '',
      type: 'course',
    };

    const { result } = renderHook(() => useCertificateDownload());
    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', '', [cert]);
    });
    expect(convertSvgToOutput).toHaveBeenCalledWith(expect.any(String), { fileName: 'certificate' });
  });

  it('stringifies non-Error thrown value (line 70 else branch)', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(certificateService.searchCertificates).mockRejectedValue('plain string error');

    const { result } = renderHook(() => useCertificateDownload());
    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course');
    });
    expect(result.current.error).toBe('plain string error');
  });

  it('clears downloading state after completion', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(convertSvgToOutput).mockResolvedValue(undefined);
    vi.mocked(certificateService.downloadCertificate).mockResolvedValue({
      data: '<svg></svg>',
      status: 200,
      headers: {},
    });

    const mockCert: IssuedCertificate = {
      identifier: 'cert-123',
      lastIssuedOn: '2024-01-01',
      name: 'Test Certificate',
      templateUrl: 'http://example.com/template.svg',
      token: 'token-123',
      type: 'course',
    };

    const { result } = renderHook(() => useCertificateDownload());

    await act(async () => {
      await result.current.downloadCertificate('course-1', 'batch-1', 'Course Name', [mockCert]);
    });

    expect(result.current.downloadingCourseId).toBeNull();
  });
});
