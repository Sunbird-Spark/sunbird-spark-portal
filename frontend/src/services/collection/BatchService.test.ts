import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchService } from './BatchService';
import { IHttpClient, init } from '../../lib/http-client';

describe('BatchService', () => {
  let mockClient: IHttpClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ data: { response: {} }, status: 200, headers: {} }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  it('should call client.post with correct url and payload for batchList', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ data: { response: {} }, status: 200, headers: {} });

    const service = new BatchService();
    await service.batchList('course_abc');

    expect(mockClient.post).toHaveBeenCalledWith('/course/v1/batch/list', {
      request: { filters: { courseId: 'course_abc' } },
    });
  });

  it('should return batchList response data', async () => {
    const mockData = {
      response: {
        content: [{ identifier: 'batch_1', name: 'Batch 1', status: 1 }],
        count: 1,
      },
    };
    mockClient.post = vi.fn().mockResolvedValue({ data: mockData, status: 200, headers: {} });

    const service = new BatchService();
    const result = await service.batchList('course_abc');

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
  });

  it('should call client.get with correct url for batchRead', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: { response: {} }, status: 200, headers: {} });

    const service = new BatchService();
    await service.batchRead('batch_xyz');

    expect(mockClient.get).toHaveBeenCalledWith('/course/v1/batch/read/batch_xyz');
  });

  it('should return batchRead response data', async () => {
    const mockData = {
      response: {
        identifier: 'batch_xyz',
        name: 'Batch XYZ',
        startDate: '2025-01-01',
      },
    };
    mockClient.get = vi.fn().mockResolvedValue({ data: mockData, status: 200, headers: {} });

    const service = new BatchService();
    const result = await service.batchRead('batch_xyz');

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
  });

  it('should call client.post with correct url and payload for enrol', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ data: {}, status: 200, headers: {} });

    const service = new BatchService();
    await service.enrol('course_1', 'user_1', 'batch_1');

    expect(mockClient.post).toHaveBeenCalledWith('/course/v1/enrol', {
      request: { courseId: 'course_1', userId: 'user_1', batchId: 'batch_1' },
    });
  });

  it('should return enrol response', async () => {
    const mockData = { result: 'enrolled' };
    mockClient.post = vi.fn().mockResolvedValue({ data: mockData, status: 200, headers: {} });

    const service = new BatchService();
    const result = await service.enrol('course_1', 'user_1', 'batch_1');

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
  });

  it('should call client.post with correct url and payload for contentStateRead', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ data: { response: {} }, status: 200, headers: {} });

    const service = new BatchService();
    const request = {
      userId: 'user_1',
      courseId: 'course_1',
      batchId: 'batch_1',
      contentIds: ['content_a', 'content_b'],
    };
    await service.contentStateRead(request);

    expect(mockClient.post).toHaveBeenCalledWith('/course/v1/content/state/read', {
      request: {
        userId: 'user_1',
        courseId: 'course_1',
        batchId: 'batch_1',
        contentIds: ['content_a', 'content_b'],
      },
    });
  });

  it('should return contentStateRead response data', async () => {
    const mockData = {
      response: {
        content: [
          { contentId: 'content_a', status: 2 },
          { contentId: 'content_b', status: 1 },
        ],
      },
    };
    mockClient.post = vi.fn().mockResolvedValue({ data: mockData, status: 200, headers: {} });

    const service = new BatchService();
    const result = await service.contentStateRead({
      userId: 'user_1',
      courseId: 'course_1',
      batchId: 'batch_1',
      contentIds: ['content_a', 'content_b'],
    });

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
  });
});
