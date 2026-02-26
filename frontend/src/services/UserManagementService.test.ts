import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserManagementService } from './UserManagementService';
import * as httpClient from '../lib/http-client';

vi.mock('../lib/http-client');

describe('UserManagementService', () => {
  let service: UserManagementService;
  let mockClient: any;

  beforeEach(() => {
    service = new UserManagementService();
    mockClient = { get: vi.fn(), post: vi.fn() };
    vi.spyOn(httpClient, 'getClient').mockReturnValue(mockClient);
  });

  /* ── searchUser ── */
  describe('searchUser', () => {
    it('should POST to /user/v3/search with correct filters', async () => {
      const mockResponse = { data: { response: { content: [] } }, status: 200, headers: {} };
      mockClient.post.mockResolvedValue(mockResponse);

      await service.searchUser('testuser');

      expect(mockClient.post).toHaveBeenCalledWith('/user/v3/search', {
        request: { filters: { userName: 'testuser' } },
      });
    });

    it('should return the API response', async () => {
      const mockUser = { userId: 'u1', userName: 'testuser', firstName: 'Test', lastName: 'User', status: 1 };
      const mockResponse = { data: { response: { content: [mockUser] } }, status: 200, headers: {} };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await service.searchUser('testuser');
      expect(result).toEqual(mockResponse);
    });
  });

  /* ── getRoles ── */
  describe('getRoles', () => {
    it('should GET /data/v1/role/read', async () => {
      const mockResponse = {
        data: {
          result: {
            roles: [
              { id: 'CONTENT_CREATOR', name: 'Content Creator', actionGroups: [] },
              { id: 'ORG_ADMIN', name: 'Org Admin', actionGroups: [] },
            ],
          },
        },
        status: 200,
        headers: {},
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getRoles();

      expect(mockClient.get).toHaveBeenCalledWith('/data/v1/role/read');
      expect(result.data?.result?.roles).toHaveLength(2);
    });

    it('should propagate errors', async () => {
      mockClient.get.mockRejectedValue(new Error('Network error'));
      await expect(service.getRoles()).rejects.toThrow('Network error');
    });
  });

  /* ── assignRole ── */
  describe('assignRole', () => {
    const userId = 'user123';
    const roleId = 'ORG_ADMIN';
    const orgId = 'org456';

    it('should POST add operation to /user/v2/role/assign', async () => {
      const mockResponse = { data: { response: 'SUCCESS' }, status: 200, headers: {} };
      mockClient.post.mockResolvedValue(mockResponse);

      await service.assignRole(userId, roleId, orgId, 'add');

      expect(mockClient.post).toHaveBeenCalledWith('/user/v2/role/assign', {
        request: {
          userId,
          roles: [{ role: roleId, operation: 'add', scope: [{ organisationId: orgId }] }],
        },
      });
    });

    it('should POST update operation', async () => {
      mockClient.post.mockResolvedValue({ data: {}, status: 200, headers: {} });
      await service.assignRole(userId, roleId, orgId, 'update');
      expect(mockClient.post).toHaveBeenCalledWith('/user/v2/role/assign',
        expect.objectContaining({
          request: expect.objectContaining({
            roles: [expect.objectContaining({ operation: 'update' })],
          }),
        })
      );
    });

    it('should POST remove operation', async () => {
      mockClient.post.mockResolvedValue({ data: {}, status: 200, headers: {} });
      await service.assignRole(userId, roleId, orgId, 'remove');
      expect(mockClient.post).toHaveBeenCalledWith('/user/v2/role/assign',
        expect.objectContaining({
          request: expect.objectContaining({
            roles: [expect.objectContaining({ operation: 'remove' })],
          }),
        })
      );
    });

    it('should propagate errors', async () => {
      mockClient.post.mockRejectedValue(new Error('Forbidden'));
      await expect(service.assignRole(userId, roleId, orgId, 'add')).rejects.toThrow('Forbidden');
    });
  });
});
