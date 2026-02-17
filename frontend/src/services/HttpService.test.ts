import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import axios from 'axios';
import { HttpService } from './HttpService';

vi.mock('axios');

describe('HttpService', () => {
  let httpService: HttpService;

  beforeEach(() => {
    httpService = new HttpService();
    vi.resetAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { key: 'value' };
    (axios.get as Mock).mockResolvedValue({ data: mockData });

    const result = await httpService.get('http://example.com/data');
    expect(result).toEqual(mockData);
    expect(axios.get).toHaveBeenCalledWith('http://example.com/data', { headers: undefined });
  });

  it('should pass headers correctly', async () => {
    const mockData = { key: 'value' };
    const headers = { Authorization: 'Bearer token' };
    (axios.get as Mock).mockResolvedValue({ data: mockData });

    await httpService.get('http://example.com/data', headers);
    expect(axios.get).toHaveBeenCalledWith('http://example.com/data', { headers });
  });

  it('should throw error on failure', async () => {
    const error = new Error('Network Error');
    (axios.get as Mock).mockRejectedValue(error);

    await expect(httpService.get('http://example.com/data')).rejects.toThrow('Network Error');
  });
});
