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

/* ── Mock global fetch ── */
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

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
    it('calls fetch with correct URL and FormData', async () => {
      const mockJson = { result: { artifactUrl: 'https://cdn.example.com/cert.svg' } };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockJson),
      });

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      const result = await service.uploadAsset('asset-1', svgBlob, 'cert.svg');
      expect(mockFetch).toHaveBeenCalledWith(
        '/portal/asset/v1/upload/asset-1',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.data).toEqual({ artifactUrl: 'https://cdn.example.com/cert.svg' });
    });

    it('throws error when fetch response is not ok (JSON error)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ params: { errmsg: 'Bad request' } })),
      });

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await expect(service.uploadAsset('asset-1', svgBlob, 'cert.svg')).rejects.toThrow('Bad request');
    });

    it('throws generic error when fetch fails with non-JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await expect(service.uploadAsset('asset-1', svgBlob, 'cert.svg')).rejects.toThrow(
        'Upload failed (500). Raw response: Internal Server Error'
      );
    });

    it('sanitizes headers to strip CRLF characters', async () => {
      const mockJson = { result: { artifactUrl: 'https://cdn.example.com/cert.svg' } };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockJson),
      });

      const headers = { 'X-User-ID': 'user\r\ninjection', 'X-Channel-Id': 'org-1' };
      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await service.uploadAsset('asset-1', svgBlob, 'cert.svg', headers);

      const fetchCall = mockFetch.mock.calls[0]!;
      expect(fetchCall[1].headers['X-User-ID']).toBe('userinjection');
    });

    it('handles missing params.errmsg in error JSON gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve(JSON.stringify({ error: 'unprocessable' })),
      });

      const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
      await expect(service.uploadAsset('asset-1', svgBlob, 'cert.svg')).rejects.toThrow(
        'Upload failed (422)'
      );
    });
  });

  /* ── uploadImageAsset ── */
  describe('uploadImageAsset', () => {
    it('calls fetch with correct URL for image file', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: { artifactUrl: 'https://cdn.example.com/logo.png' } }),
      });

      const imageFile = new File(['data'], 'logo.png', { type: 'image/png' });
      const result = await service.uploadImageAsset('img-1', imageFile, 'logo.png');
      expect(mockFetch).toHaveBeenCalledWith(
        '/portal/asset/v1/upload/img-1',
        expect.objectContaining({ method: 'POST' })
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

  /* ── searchLogos ── */
  describe('searchLogos', () => {
    it('calls post with createdBy filter when provided', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, content: [] }, status: 200, headers: {} });
      await service.searchLogos('org-1', 'user-1');
      const call = mockPost.mock.calls[0]!;
      expect(call[1].request.filters.createdBy).toBe('user-1');
    });

    it('calls post without createdBy when not provided', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, content: [] }, status: 200, headers: {} });
      await service.searchLogos('org-1');
      const call = mockPost.mock.calls[0]!;
      expect(call[1].request.filters.createdBy).toBeUndefined();
    });

    it('passes correct channel filter', async () => {
      mockPost.mockResolvedValue({ data: { count: 0, content: [] }, status: 200, headers: {} });
      await service.searchLogos('org-abc');
      const call = mockPost.mock.calls[0]!;
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
      const call = mockPost.mock.calls[0]!;
      expect(call[1].request.filters.certType).toBe('cert template');
      expect(call[1].request.filters.channel).toBe('org-1');
    });
  });
});
