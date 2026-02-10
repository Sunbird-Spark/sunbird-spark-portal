import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getUserByEmail, createUserWithEmail } from './userService.js';
import logger from '../utils/logger.js';

vi.mock('axios');
vi.mock('uuid');
vi.mock('dayjs');
vi.mock('../config/env.js', () => ({
  envConfig: {
    KONG_URL: 'http://localhost:8000',
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

describe('UserService integration', () => {
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      session: {
        save: vi.fn((callback: any) => callback(null)),
      },
      sessionID: 'test-session-id',
    };

    mockRequest.get = vi.fn().mockReturnValue('test-device-id');
    mockRequest.session.kongToken = 'test-kong-token';

    mockUuidv4.mockReturnValue('test-uuid' as any);
    mockDayjs.mockReturnValue({
      format: vi.fn().mockReturnValue('2024-01-01 12:00:00:000'),
    } as any);
  });

  describe('getUserByEmail', () => {
    it('returns true when user exists', async () => {
      const mockResponse = {
        data: { responseCode: 'OK', result: { exists: true } },
      };
      (mockAxios.get as any).mockResolvedValue(mockResponse);
      const result = await getUserByEmail('test@example.com', mockRequest as Request);
      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async () => {
      const mockResponse = {
        data: { responseCode: 'OK', result: { exists: false } },
      };
      (mockAxios.get as any).mockResolvedValue(mockResponse);
      const result = await getUserByEmail('nonexistent@example.com', mockRequest as Request);
      expect(result).toBe(false);
    });

    it('throws with errmsg when response code not OK', async () => {
      const mockResponse = {
        data: { responseCode: 'CLIENT_ERROR', params: { errmsg: 'Invalid email format' } },
      };
      (mockAxios.get as any).mockResolvedValue(mockResponse);
      await expect(getUserByEmail('invalid-email', mockRequest as Request)).rejects.toThrow(
        'Invalid email format'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch user by google emailid: CLIENT_ERROR'
      );
    });

    it('throws with err when errmsg missing', async () => {
      const mockResponse = {
        data: { responseCode: 'SERVER_ERROR', params: { err: 'INTERNAL_ERROR' } },
      };
      (mockAxios.get as any).mockResolvedValue(mockResponse);
      await expect(getUserByEmail('test@example.com', mockRequest as Request)).rejects.toThrow(
        'INTERNAL_ERROR'
      );
    });
  });

  describe('createUserWithEmail', () => {
    it('creates user with email ID', async () => {
      const googleUser = { name: 'Test User', emailId: 'test@example.com' };
      const mockResponse = {
        data: { responseCode: 'OK', result: { userId: 'new-user-id', response: 'SUCCESS' } },
      };
      (mockAxios.post as any).mockResolvedValue(mockResponse);
      const result = await createUserWithEmail(googleUser, 'test-client-id', mockRequest as Request);
      expect(result).toEqual(mockResponse.data);
    });

    it('throws when user name empty or missing', async () => {
      const cases = [
        { name: '', emailId: 'test@example.com' },
        { emailId: 'test@example.com' } as any,
      ];
      for (const googleUser of cases) {
        await expect(
          createUserWithEmail(googleUser, 'test-client-id', mockRequest as Request)
        ).rejects.toThrow('USER_NAME_NOT_PRESENT');
      }
    });

    it('throws with errmsg when response not OK', async () => {
      const googleUser = { name: 'Test User', emailId: 'test@example.com' };
      const mockResponse = {
        data: { responseCode: 'CLIENT_ERROR', params: { errmsg: 'Email already exists' } },
      };
      (mockAxios.post as any).mockResolvedValue(mockResponse);
      await expect(
        createUserWithEmail(googleUser, 'test-client-id', mockRequest as Request)
      ).rejects.toThrow('Email already exists');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create user with google emailid, response: CLIENT_ERROR'
      );
    });

    it('throws with err when errmsg missing', async () => {
      const googleUser = { name: 'Test User', emailId: 'test@example.com' };
      const mockResponse = {
        data: { responseCode: 'SERVER_ERROR', params: { err: 'DATABASE_ERROR' } },
      };
      (mockAxios.post as any).mockResolvedValue(mockResponse);
      await expect(
        createUserWithEmail(googleUser, 'test-client-id', mockRequest as Request)
      ).rejects.toThrow('DATABASE_ERROR');
    });
  });
});
