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
      patch: vi.fn(),
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

  it('should return result object if present in successful response', async () => {
    const mockResult = { id: 1, name: 'test' };
    const mockResponse = {
      data: {
        id: "api.test",
        responseCode: "OK",
        result: mockResult
      },
      status: 200,
      headers: {}
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);

    const result = await adapter.get('/test');
    expect(result.data).toEqual(mockResult);
    expect(result.status).toBe(200);
  });

  it('should return full data if result is missing in successful response', async () => {
    const mockData = { id: 1, name: 'test' }; // No 'result' key
    const mockResponse = { data: mockData, status: 200, headers: {} };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);

    const result = await adapter.get('/test');
    expect(result.data).toEqual(mockData);
  });

  it('should throw with error message on 4xx/5xx response', async () => {
    const mockResponse = { data: { params: { errmsg: 'Something went wrong' } }, status: 500, headers: {} };

    const error: any = new Error('Server Error');
    error.isAxiosError = true;
    error.response = mockResponse;

    mockAxiosInstance.get.mockRejectedValue(error);

    await expect(adapter.get('/test')).rejects.toThrow('Something went wrong');
  });

  it('should throw with request failed message when params.errmsg is missing', async () => {
    const mockResponse = { data: {}, status: 500, headers: {} };

    const error: any = new Error('Server Error');
    error.isAxiosError = true;
    error.response = mockResponse;

    mockAxiosInstance.get.mockRejectedValue(error);

    await expect(adapter.get('/test')).rejects.toThrow('Server Error');
  });

  it('should throw on 4xx so status handlers are not invoked', async () => {
    const handler = vi.fn();
    adapter = new AxiosAdapter({
      baseURL: 'http://test.com',
      statusHandlers: { 403: handler },
    });

    const mockResponse = { data: null, status: 403, headers: {} };
    const error: any = new Error('Forbidden');
    error.isAxiosError = true;
    error.response = mockResponse;

    mockAxiosInstance.get.mockRejectedValue(error);

    await expect(adapter.get('/test')).rejects.toThrow('Forbidden');
    expect(handler).not.toHaveBeenCalled();
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
