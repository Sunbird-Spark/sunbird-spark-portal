import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { fetchUserById, setUserSession } from './userService.js';
import logger from '../utils/logger.js';

vi.mock('axios');
vi.mock('uuid');
vi.mock('dayjs');
vi.mock('../config/env.js', () => ({
  envConfig: {
    KONG_URL: 'http://localhost:8000',
    KONG_LOGGEDIN_FALLBACK_TOKEN: 'fallback-token-loggedin',
    KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-token-anonymous',
  },
}));
vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAxios = vi.mocked(axios);
const mockUuidv4 = vi.mocked(uuidv4);
const mockDayjs = vi.mocked(dayjs);
const mockLogger = vi.mocked(logger);

describe('UserService', () => {
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      session: {
        save: vi.fn((callback: any) => callback(null)),
      },
      sessionID: 'test-session-id',
    };

    mockUuidv4.mockReturnValue('test-uuid' as any);
    mockDayjs.mockReturnValue({
      format: vi.fn().mockReturnValue('2024-01-01 12:00:00:000'),
    } as any);
  });

  describe('fetchUserById', () => {
    it('fetches user by ID using userAccessToken from session', async () => {
      mockRequest.session.userId = 'test-user-id';
      mockRequest.session.kongToken = 'test-kong-token';
      mockRequest.session.userAccessToken = 'kong-access-token';
      mockRequest.oidc = {
        isAuthenticated: true,
        accessToken: 'test-auth-token',
      };

      const mockUserData = {
        responseCode: 'OK',
        result: { response: { id: 'test-user-id', userName: 'testuser' } },
      };

      (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

      const result = await fetchUserById('test-user-id', mockRequest as Request);

      expect(mockAxios.get).toHaveBeenCalledWith('http://localhost:8000/user/v5/read/test-user-id', {
        headers: {
          'x-msgid': 'test-uuid',
          ts: '2024-01-01 12:00:00:000',
          'Content-Type': 'application/json',
          accept: 'application/json',
          Authorization: 'Bearer test-kong-token',
          'x-authenticated-user-token': 'kong-access-token',
        },
      });

      expect(result).toEqual(mockUserData);
    });

    it('falls back to OIDC accessToken when userAccessToken is not set', async () => {
      mockRequest.session.userId = 'test-user-id';
      mockRequest.session.kongToken = 'test-kong-token';
      mockRequest.oidc = {
        isAuthenticated: true,
        accessToken: 'test-auth-token',
      };

      const mockUserData = {
        responseCode: 'OK',
        result: { response: { id: 'test-user-id', userName: 'testuser' } },
      };

      (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

      await fetchUserById('test-user-id', mockRequest as Request);

      expect(mockAxios.get).toHaveBeenCalledWith(expect.any(String), {
        headers: expect.objectContaining({
          'x-authenticated-user-token': 'test-auth-token',
        }),
      });
    });

    it('uses logged-in fallback token when kong token missing', async () => {
      mockRequest.session.userId = 'test-user-id';
      mockRequest.session.kongToken = undefined;

      const mockUserData = {
        responseCode: 'OK',
        result: { response: { id: 'test-user-id', userName: 'testuser' } },
      };

      (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

      await fetchUserById('test-user-id', mockRequest as Request);

      expect(mockAxios.get).toHaveBeenCalledWith(expect.any(String), {
        headers: expect.objectContaining({
          Authorization: 'Bearer fallback-token-loggedin',
        }),
      });
    });

    it('uses anonymous fallback token when no userId in session', async () => {
      mockRequest.session.userId = undefined;
      mockRequest.session.kongToken = undefined;

      const mockUserData = {
        responseCode: 'OK',
        result: { response: { id: 'test-user-id', userName: 'testuser' } },
      };

      (mockAxios.get as any).mockResolvedValue({ data: mockUserData });

      await fetchUserById('test-user-id', mockRequest as Request);

      expect(mockAxios.get).toHaveBeenCalledWith(expect.any(String), {
        headers: expect.objectContaining({
          Authorization: 'Bearer fallback-token-anonymous',
        }),
      });
    });
  });

  describe('setUserSession', () => {
    it('populates session with user profile data', () => {
      const userApiResponse = {
        responseCode: 'OK',
        result: {
          response: {
            id: 'test-user-id',
            userId: 'test-user-id',
            userName: 'testuser',
            roles: [{ role: 'USER' }, { role: 'LEARNER' }],
            organisations: [
              { organisationId: 'org1', roles: ['CONTENT_CREATOR'] },
              { organisationId: 'org2', roles: ['ADMIN'] },
            ],
            rootOrg: {
              id: 'root-org-id',
              hashTagId: 'root-hashtag',
              slug: 'root-slug',
              orgName: 'Root Organization',
              channel: 'root-channel',
              rootOrgId: 'root-org-id',
            },
          },
        },
      };

      setUserSession(mockRequest as Request, userApiResponse);

      expect(mockRequest.session.userId).toBe('test-user-id');
      expect(mockRequest.session.userName).toBe('testuser');
      expect(mockRequest.session.userSid).toBe('test-session-id');
      expect(mockRequest.session.roles).toEqual(['USER', 'LEARNER', 'PUBLIC']);
      expect(mockRequest.session.orgs).toEqual(['org1', 'org2']);
      expect(mockRequest.session.rootOrgId).toBe('root-org-id');
      expect(mockRequest.session.rootOrg).toEqual({
        id: 'root-org-id',
        slug: 'root-slug',
        orgName: 'Root Organization',
        channel: 'root-channel',
        hashTagId: 'root-hashtag',
        rootOrgId: 'root-org-id',
      });
    });

    it('handles organizations with missing data', () => {
      const userApiResponse = {
        responseCode: 'OK',
        result: {
          response: {
            id: 'test-user-id',
            userName: 'testuser',
            roles: [{ role: 'USER' }],
            organisations: [
              { organisationId: 'org1' },
              { organisationId: null, roles: ['CONTENT_CREATOR'] },
              { organisationId: 'valid-org', roles: ['LEARNER'] },
            ],
          },
        },
      } as any;

      setUserSession(mockRequest as Request, userApiResponse);

      expect(mockRequest.session.roles).toEqual(['USER', 'PUBLIC']);
      expect(mockRequest.session.orgs).toEqual(['org1', 'valid-org']);
      expect(mockRequest.session.rootOrgId).toBeUndefined();
    });

    it('handles string roles', () => {
      const userApiResponse = {
        responseCode: 'OK',
        result: {
          response: {
            id: 'test-user-id',
            userName: 'testuser',
            roles: ['USER', 'LEARNER'],
            organisations: [],
          },
        },
      };

      setUserSession(mockRequest as Request, userApiResponse);

      expect(mockRequest.session.roles).toEqual(['USER', 'LEARNER', 'PUBLIC']);
    });

    it('does not populate session when response code is not OK', () => {
      const userApiResponse = {
        responseCode: 'CLIENT_ERROR',
        result: { response: { id: 'test-user-id', userName: 'testuser' } },
      };

      setUserSession(mockRequest as Request, userApiResponse);

      expect(mockRequest.session.userId).toBeUndefined();
      expect(mockRequest.session.userName).toBeUndefined();
    });

    it('handles errors gracefully', () => {
      const userApiResponse = {
        responseCode: 'OK',
        result: { response: null },
      } as any;

      expect(() => {
        setUserSession(mockRequest as Request, userApiResponse);
      }).not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'setUserSession :: Failed to persist user session data',
        expect.any(Error)
      );
    });
  });
});
