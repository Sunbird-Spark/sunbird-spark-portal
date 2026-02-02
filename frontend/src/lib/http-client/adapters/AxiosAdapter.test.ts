import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { AxiosAdapter } from './AxiosAdapter';

vi.mock('axios');

describe('AxiosAdapter', () => {
  let adapter: AxiosAdapter;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: { common: {} } },
    };
    (axios.create as any).mockReturnValue(mockAxiosInstance);
    // Mock axios.isAxiosError
    (axios.isAxiosError as any) = vi.fn((payload) => payload?.isAxiosError === true);

    adapter = new AxiosAdapter({ baseURL: 'http://test.com' });
  });

  it('should use default apiPrefix /portal if not provided', () => {
    // Re-create adapter without baseURL to test default prefix logic
    new AxiosAdapter({});
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: '/portal'
    }));
  });

  it('should use provided apiPrefix', () => {
    new AxiosAdapter({ apiPrefix: '/api' });
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: '/api'
    }));
  });

  it('should combine baseURL and apiPrefix', () => {
    new AxiosAdapter({ baseURL: 'http://host.com', apiPrefix: '/api' });
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'http://host.com/api'
    }));
  });

  it('should return ApiResponse on successful get', async () => {
    const mockResponse = { data: { id: 1 }, status: 200, headers: {} };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);

    const result = await adapter.get('/test');
    expect(result).toEqual(mockResponse);
  });

  it('should trigger status handler on specific status', async () => {
    const handler = vi.fn();
    adapter = new AxiosAdapter({
      baseURL: 'http://test.com',
      statusHandlers: { 403: handler },
    });

    const mockResponse = { data: null, status: 403, headers: {} };
    // Simulate axios throwing an error with response property
    const error: any = new Error('Forbidden');
    error.isAxiosError = true;
    error.response = mockResponse;

    mockAxiosInstance.get.mockRejectedValue(error);

    const result = await adapter.get('/test');
    expect(handler).toHaveBeenCalledWith(result);
    expect(result.status).toBe(403);
  });

  it('should add headers using updateHeaders', () => {
    adapter.updateHeaders([
      { key: 'Authorization', value: 'Bearer token123', action: 'add' },
      { key: 'X-Custom-Header', value: 'CustomValue', action: 'add' },
    ]);
    expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer token123');
    expect(mockAxiosInstance.defaults.headers.common['X-Custom-Header']).toBe('CustomValue');
  });

  it('should remove headers using updateHeaders', () => {
    mockAxiosInstance.defaults.headers.common['Authorization'] = 'Bearer token123';
    mockAxiosInstance.defaults.headers.common['X-Custom-Header'] = 'CustomValue';

    adapter.updateHeaders([
      { key: 'Authorization', action: 'remove' },
    ]);

    expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
    expect(mockAxiosInstance.defaults.headers.common['X-Custom-Header']).toBe('CustomValue');
  });
});
