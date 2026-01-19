import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHealth } from './health';
import { apiClient } from './client';

// Mock the apiClient
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient,true);

describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return health status successfully', async () => {
    const mockResponse = {
      data: { status: 'healthy' },
    };

    mockedApiClient.get.mockResolvedValueOnce(mockResponse);

    const result = await getHealth();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/health');
    expect(result).toEqual({ status: 'healthy' });
  });

  it('should handle error responses', async () => {
    const mockError = new Error('Network error');
    mockedApiClient.get.mockRejectedValueOnce(mockError);

    await expect(getHealth()).rejects.toThrow('Network error');
    expect(mockedApiClient.get).toHaveBeenCalledWith('/health');
  });

  it('should return correct type', async () => {
    const mockResponse = {
      data: { status: 'healthy' },
    };

    mockedApiClient.get.mockResolvedValueOnce(mockResponse);

    const result = await getHealth();

    expect(typeof result.status).toBe('string');
    expect(result).toHaveProperty('status');
  });
});
