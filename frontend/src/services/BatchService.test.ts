import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchService } from './BatchService';

/* ── Mock http-client ── */
const mockPost = vi.fn();
const mockPatch = vi.fn();

vi.mock('../lib/http-client', () => ({
  getClient: () => ({
    post: mockPost,
    patch: mockPatch,
  }),
}));

describe('BatchService', () => {
  let service: BatchService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BatchService();
  });

  /* ── listBatches ── */
  describe('listBatches', () => {
    it('calls post with correct endpoint and filters', async () => {
      const mockResponse = {
        data: { response: { content: [], count: 0 } },
        status: 200,
        headers: {},
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await service.listBatches('course-123', 'creator-456');
      expect(mockPost).toHaveBeenCalledWith('/course/v1/batch/list', {
        request: {
          filters: {
            courseId: 'course-123',
            status: ['0', '1', '2'],
            createdBy: 'creator-456',
          },
          sort_by: { createdDate: 'desc' },
        },
      });
      expect(result).toBe(mockResponse);
    });

    it('includes all status values (upcoming, ongoing, expired)', async () => {
      mockPost.mockResolvedValue({ data: { response: { content: [] } }, status: 200, headers: {} });
      await service.listBatches('course-1', 'user-1');
      const call = mockPost.mock.calls[0];
      expect(call[1].request.filters.status).toEqual(['0', '1', '2']);
    });

    it('sorts by createdDate descending', async () => {
      mockPost.mockResolvedValue({ data: { response: { content: [] } }, status: 200, headers: {} });
      await service.listBatches('course-1', 'user-1');
      const call = mockPost.mock.calls[0];
      expect(call[1].request.sort_by).toEqual({ createdDate: 'desc' });
    });
  });

  /* ── createBatch ── */
  describe('createBatch', () => {
    it('calls post with correct endpoint and request', async () => {
      const mockResponse = { data: { batchId: 'batch-new-1' }, status: 200, headers: {} };
      mockPost.mockResolvedValue(mockResponse);

      const batchRequest = {
        courseId: 'course-123',
        name: 'Batch One',
        enrollmentType: 'open' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        createdBy: 'user-1',
        createdFor: ['org-1'],
        tandc: true,
        issueCertificate: true,
      };

      const result = await service.createBatch(batchRequest);
      expect(mockPost).toHaveBeenCalledWith(
        '/course/v1/batch/create',
        { request: batchRequest },
        undefined
      );
      expect(result).toBe(mockResponse);
    });

    it('passes custom headers to post', async () => {
      mockPost.mockResolvedValue({ data: { batchId: 'batch-new-2' }, status: 200, headers: {} });
      const headers = { 'X-User-ID': 'u1', 'X-Channel-Id': 'org-1' };
      await service.createBatch({} as any, headers);
      expect(mockPost).toHaveBeenCalledWith('/course/v1/batch/create', expect.any(Object), headers);
    });
  });

  /* ── updateBatch ── */
  describe('updateBatch', () => {
    it('calls patch with correct endpoint and request', async () => {
      const mockResponse = { data: {}, status: 200, headers: {} };
      mockPatch.mockResolvedValue(mockResponse);

      const updateRequest = {
        id: 'batch-1',
        courseId: 'course-123',
        name: 'Updated Batch',
        enrollmentType: 'open' as const,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        createdFor: ['org-1'],
        mentors: ['mentor-1'],
        issueCertificate: false,
      };

      const result = await service.updateBatch(updateRequest);
      expect(mockPatch).toHaveBeenCalledWith(
        '/course/v1/batch/update',
        { request: updateRequest },
        undefined
      );
      expect(result).toBe(mockResponse);
    });

    it('passes custom headers to patch', async () => {
      mockPatch.mockResolvedValue({ data: {}, status: 200, headers: {} });
      const headers = { 'X-User-ID': 'u2' };
      await service.updateBatch({} as any, headers);
      expect(mockPatch).toHaveBeenCalledWith('/course/v1/batch/update', expect.any(Object), headers);
    });
  });
});
