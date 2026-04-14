import { describe, it, expect } from 'vitest';
import { apiClient } from './client';

describe('API Client', () => {
  it('should be properly configured with base URL', () => {
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  it('should be an axios instance', () => {
    expect(apiClient.interceptors).toBeDefined();
    expect(apiClient.defaults).toBeDefined();
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
    expect(typeof apiClient.put).toBe('function');
    expect(typeof apiClient.delete).toBe('function');
  });

  it('should have proper headers structure', () => {
    expect(apiClient.defaults.headers).toBeDefined();
  });
});