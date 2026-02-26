import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CertificateService } from './CertificateService';

/* ── Mock http-client ── */
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockGet = vi.fn();

vi.mock('../lib/http-client', () => ({
  getClient: () => ({
    post: mockPost,
    patch: mockPatch,
    get: mockGet,
  }),
}));



describe('CertificateService', () => {
  let service: CertificateService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CertificateService();
  });

  /* ── createAsset ── */
  describe('createAsset', () => {
    it('calls post with correct endpoint and payload', async () => {
      const mockResponse = { data: { identifier: 'asset-1', node_id: 1, versionKey: 'v1' }, status: 200, headers: {} };
      mockPost.mockResolvedValue(mockResponse);

      const assetData = {
        name: 'Test Cert',
        code: 'Test Cert',
        mimeType: 'image/svg+xml' as const,
        license: 'CC BY 4.0',
        primaryCategory: 'Certificate Template' as const,
        mediaType: 'image' as const,
        certType: 'cert template' as const,
        channel: 'org-123',
        issuer: { name: 'Org Name', url: 'https://example.com' },
        signatoryList: [{ name: 'Director', designation: '', id: 'Director/Director', image: '' }],
      };

      const result = await service.createAsset(assetData);
      expect(mockPost).toHaveBeenCalledWith(
        '/asset/v1/create',
        { request: { asset: assetData } },
        undefined
      );
      expect(result).toBe(mockResponse);
    });

    it('passes headers to post', async () => {
      mockPost.mockResolvedValue({ data: { identifier: 'asset-1' }, status: 200, headers: {} });
      const headers = { 'X-User-ID': 'u1', 'X-Channel-Id': 'org-1' };
      await service.createAsset({} as any, headers);
      expect(mockPost).toHaveBeenCalledWith('/asset/v1/create', expect.any(Object), headers);
    });
  });

  /* ── createImageAsset ── */
  describe('createImageAsset', () => {
    it('calls post with correct payload for image asset', async () => {
      mockPost.mockResolvedValue({ data: { identifier: 'img-1' }, status: 200, headers: {} });
      await service.createImageAsset('Logo', 'image/png', 'org-1', { 'X-User-ID': 'u1' });
      expect(mockPost).toHaveBeenCalledWith(
        '/asset/v1/create',
        {
          request: {
            asset: {
              name: 'Logo',
              code: 'Logo',
              mimeType: 'image/png',
              license: 'CC BY 4.0',
              primaryCategory: 'Asset',
              mediaType: 'image',
              channel: 'org-1',
            },
          },
        },
        { 'X-User-ID': 'u1' }
      );
    });

    it('calls post without headers when headers are omitted', async () => {
      mockPost.mockResolvedValue({ data: { identifier: 'img-2' }, status: 200, headers: {} });
      await service.createImageAsset('Sig', 'image/jpeg', 'org-2');
      expect(mockPost).toHaveBeenCalledWith('/asset/v1/create', expect.any(Object), undefined);
    });
  });

  /* ── uploadAsset (via _uploadFile) ── */
  describe('uploadAsset', () => {
    it('calls post with correct URL and FormData', async () => {
      const mockResult = { artifactUrl: 'https://cdn.example.com/cert.svg', content_url: 'https://cdn.example.com/cert.svg' };
      mockPost.mockResolvedValue({
        status: 200,
        data: mockResult,
        headers: {},
      });

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      const result = await service.uploadAsset('asset-1', svgBlob, 'cert.svg');
      expect(mockPost).toHaveBeenCalledWith(
        `/asset/v1/upload/asset-1`,
        expect.any(FormData), // Form data matches are tricky, but checking if it's passed as 2nd arg
        expect.any(Object)
      );
      expect(result.data).toEqual(mockResult);
    });

    it('throws error when post response is not ok (JSON error)', async () => {
      mockPost.mockRejectedValue(new Error('Bad request'));

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await expect(service.uploadAsset('asset-1', svgBlob, 'cert.svg')).rejects.toThrow('Bad request');
    });

    it('throws generic error when post fails with non-JSON body', async () => {
      mockPost.mockRejectedValue(new Error('Internal Server Error'));

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await expect(service.uploadAsset('asset-1', svgBlob, 'cert.svg')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('sanitizes headers to strip CRLF characters', async () => {
      const mockResult = { artifactUrl: 'https://cdn.example.com/cert.svg', content_url: 'https://cdn.example.com/cert.svg' };
      mockPost.mockResolvedValue({
        status: 200,
        data: mockResult,
        headers: {},
      });

      const headers = { 'X-User-ID': 'user\r\ninjection', 'X-Channel-Id': 'org-1' };
      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await service.uploadAsset('asset-1', svgBlob, 'cert.svg', headers);

      const postCall = mockPost.mock.calls.find(c => c[0].includes('upload/asset-1')) as any[];
      expect(postCall[2]['X-User-ID']).toBe('userinjection');
    });

    it('handles missing params.errmsg in error JSON gracefully', async () => {
      mockPost.mockRejectedValue(new Error('unprocessable'));

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await expect(service.uploadAsset('asset-1', svgBlob, 'cert.svg')).rejects.toThrow(
        'unprocessable'
      );
    });
  });

  /* ── uploadImageAsset ── */
  describe('uploadImageAsset', () => {
    it('calls post with correct URL for image file', async () => {
      const mockResult = { artifactUrl: 'https://cdn.example.com/logo.png', content_url: 'https://cdn.example.com/logo.png' };
      mockPost.mockResolvedValue({
        status: 200,
        data: mockResult,
        headers: {},
      });

      const imageFile = new File(['data'], 'logo.png', { type: 'image/png' });
      const result = await service.uploadImageAsset('img-1', imageFile, 'logo.png');
      expect(mockPost).toHaveBeenCalledWith(
        `/asset/v1/upload/img-1`,
        expect.any(FormData),
        expect.any(Object)
      );
      expect(result.data.artifactUrl).toBe('https://cdn.example.com/logo.png');
    });
  });

  /* ── addTemplateToBatch ── */
  describe('addTemplateToBatch', () => {
    it('calls patch with correct endpoint and request', async () => {
      mockPatch.mockResolvedValue({ data: {}, status: 200, headers: {} });
      const request = {
        batch: {
          courseId: 'course-1',
          batchId: 'batch-1',
          template: {
            identifier: 'tmpl-1',
            criteria: { enrollment: { status: 2 } },
            name: 'My Cert',
            issuer: { name: 'Org', url: 'https://example.com' },
            previewUrl: 'https://cdn.example.com/cert.png',
            signatoryList: [],
          },
        },
      };
      await service.addTemplateToBatch(request, { 'X-User-ID': 'u1' });
      expect(mockPatch).toHaveBeenCalledWith(
        'course/batch/cert/v1/template/add',
        { request },
        { 'X-User-ID': 'u1' }
      );
    });
  });

  /* ── removeTemplateFromBatch ── */
  describe('removeTemplateFromBatch', () => {
    it('calls patch with correct endpoint and request', async () => {
      mockPatch.mockResolvedValue({ data: {}, status: 200, headers: {} });
      const request = {
        batch: {
          courseId: 'course-1',
          batchId: 'batch-1',
          template: {
            identifier: 'tmpl-1',
          },
        },
      };
      await service.removeTemplateFromBatch(request, { 'X-User-ID': 'u1' });
      expect(mockPatch).toHaveBeenCalledWith(
        'course/batch/cert/v1/template/remove',
        { request },
        { 'X-User-ID': 'u1' }
      );
    });
  });

  /* ── searchLogos ── */
  describe('searchLogos', () => {
    it('calls post with createdBy filter when provided', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, content: [] }, status: 200, headers: {} });
      await service.searchLogos('org-1', 'user-1');
      const call = mockPost.mock.calls[0] as any[];
      expect(call[1].request.filters.createdBy).toBe('user-1');
    });

    it('calls post without createdBy when not provided', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, content: [] }, status: 200, headers: {} });
      await service.searchLogos('org-1');
      const call = mockPost.mock.calls[0] as any[];
      expect(call[1].request.filters.createdBy).toBeUndefined();
    });

    it('passes correct channel filter', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, content: [] }, status: 200, headers: {} });
      await service.searchLogos('org-abc');
      const call = mockPost.mock.calls[0] as any[];
      expect(call[1].request.filters.channel).toBe('org-abc');
    });
  });

  /* ── readCertTemplate ── */
  describe('readCertTemplate', () => {
    it('calls get with identifier in URL', async () => {
      mockGet.mockResolvedValue({ data: { content: {} }, status: 200, headers: {} });
      await service.readCertTemplate('tmpl-1');
      expect(mockGet).toHaveBeenCalledWith(
        '/content/v1/read/tmpl-1?fields=signatoryList,issuer,artifactUrl,name,identifier'
      );
    });
  });

  /* ── searchCertTemplates ── */
  describe('searchCertTemplates', () => {
    it('calls post with certType filter', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, content: [] }, status: 200, headers: {} });
      await service.searchCertTemplates('org-1');
      const call = mockPost.mock.calls[0] as any[];
      expect(call[1].request.filters.certType).toBe('cert template');
      expect(call[1].request.filters.channel).toBe('org-1');
    });
  });
});
