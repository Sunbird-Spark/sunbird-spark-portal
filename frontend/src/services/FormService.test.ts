import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormService } from './FormService';
import { IHttpClient, init } from '../lib/http-client';

describe('FormService', () => {
  let mockClient: IHttpClient;
  let service: FormService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a mock client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };

    // Initialize the singleton with our mock
    init(mockClient);

    // Instantiate service
    service = new FormService();
  });

  it('should call client.post for formRead with correct request body', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ data: { result: { form: {} } }, status: 200, headers: {} });

    const request = {
      type: 'content',
      subType: 'resource',
      action: 'create',
      component: '',
      rootOrgId: '',
      framework: '*'
    };

    await service.formRead(request);

    expect(mockClient.post).toHaveBeenCalledWith(
      '/data/v1/form/read',
      {
        request: {
          type: 'content',
          subType: 'resource',
          action: 'create',
          component: '',
          rootOrgId: '',
          framework: '*'
        },
      }
    );
  });

  it('should use default values for optional fields', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ data: { result: { form: {} } }, status: 200, headers: {} });

    const request = {
      type: 'content',
      action: 'create',
    };

    await service.formRead(request);

    expect(mockClient.post).toHaveBeenCalledWith(
      '/data/v1/form/read',
      {
        request: {
          type: 'content',
          subType: '',
          action: 'create',
          component: '*',
          rootOrgId: '*',
          framework: '*'
        },
      }
    );
  });
});
