import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.envExample') });

const { mockGoogleAuthService, mockUserService, mockCreateSession } = vi.hoisted(() => {
  return {
    mockGoogleAuthService: {
      generateAuthUrl: vi.fn(),
      verifyAndGetProfile: vi.fn(),
    },
    mockUserService: {
      fetchUserByEmailId: vi.fn(),
      createUserWithMailId: vi.fn(),
    },
    mockCreateSession: vi.fn(),
  };
});

vi.mock('../services/googleAuthService.js', () => ({
  default: mockGoogleAuthService,
  createSession: mockCreateSession,
}));

vi.mock('@/services/googleAuthService.js', () => ({
  default: mockGoogleAuthService,
  createSession: mockCreateSession,
}));

vi.mock('../services/userService.js', () => mockUserService);

vi.mock('../services/kongAuthService.js', () => ({
  generateKongToken: vi.fn().mockResolvedValue('mock-kong-token'),
}));

describe('GoogleController - /google/auth', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let initiateGoogleAuth: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.DOMAIN_URL = 'https://example.com';

    const controller = await import('../controllers/googleController.js');
    initiateGoogleAuth = controller.initiateGoogleAuth;

    mockReq = {
      query: {},
      session: {} as any,
      sessionID: 'test-session-id',
      get: vi.fn(),
    };

    mockRes = {
      redirect: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('redirects to home when any required query param is missing', () => {
    const cases = [
      {},
      { redirect_uri: 'https://example.com/callback', error_callback: 'https://example.com/error' },
      { client_id: 'test-client', error_callback: 'https://example.com/error' },
      { client_id: 'test-client', redirect_uri: 'https://example.com/callback' },
    ];

    for (const q of cases) {
      mockReq.query = q;
      initiateGoogleAuth(mockReq, mockRes);
      expect(mockRes.redirect).toHaveBeenCalledWith('/');
      (mockRes.redirect as any).mockClear();
    }
  });

  it('returns 400 for invalid redirect_uri hostname', () => {
    mockReq.query = {
      client_id: 'test-client',
      redirect_uri: 'https://malicious.com/callback',
      error_callback: 'https://example.com/error',
    };

    initiateGoogleAuth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith('INVALID_REDIRECT_URI');
  });

  it('stores OAuth data in session and redirects to Google auth URL', () => {
    const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test';
    mockGoogleAuthService.generateAuthUrl.mockReturnValue(mockAuthUrl);

    mockReq.query = {
      client_id: 'test-client',
      redirect_uri: 'https://example.com/callback',
      error_callback: 'https://example.com/error',
    };

    initiateGoogleAuth(mockReq, mockRes);

    expect(mockReq.session?.googleOAuth).toBeDefined();
    expect(mockReq.session?.googleOAuth?.client_id).toBe('test-client');
    expect(mockReq.session?.googleOAuth?.redirect_uri).toBe('https://example.com/callback');
    expect(mockReq.session?.googleOAuth?.error_callback).toBe('https://example.com/error');
    expect(mockReq.session?.googleOAuth?.nonce).toBeDefined();
    expect(mockReq.session?.googleOAuth?.state).toBeDefined();
    expect(mockRes.redirect).toHaveBeenCalledWith(mockAuthUrl);
  });

  it('redirects to error_callback on exception', () => {
    mockGoogleAuthService.generateAuthUrl.mockImplementation(() => {
      throw new Error('Auth URL generation failed');
    });

    mockReq.query = {
      client_id: 'test-client',
      redirect_uri: 'https://example.com/callback',
      error_callback: 'https://example.com/error',
    };

    initiateGoogleAuth(mockReq, mockRes);

    expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/error?error=GOOGLE_AUTH_INIT_FAILED');
  });
});
