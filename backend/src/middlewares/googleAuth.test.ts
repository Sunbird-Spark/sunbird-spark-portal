import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction, RequestHandler } from 'express';

vi.mock('../services/googleService.js');
vi.mock('../utils/logger.js', () => ({
	default: {
		info: vi.fn(),
		error: vi.fn()
	}
}));

describe('validateRecaptcha middleware', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	const baseEnvConfig = {
		GOOGLE_RECAPTCHA_SECRET: 'test-secret',
		GOOGLE_RECAPTCHA_VERIFY_URL: 'https://www.google.com/recaptcha/api/siteverify'
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		mockRequest = {
			query: {},
			headers: {}
		};

		mockResponse = {
			status: vi.fn().mockReturnThis(),
			send: vi.fn()
		};

		mockNext = vi.fn() as NextFunction;
	});

	const importMiddleware = async (overrideEnv?: Partial<typeof baseEnvConfig>) => {
		vi.doMock('../config/env.js', () => ({
			envConfig: { ...baseEnvConfig, ...overrideEnv }
		}));
		const module = await import('./googleAuth.js');
		return module.validateRecaptcha as RequestHandler;
	};

	it('captcha is valid: should call the next function', async () => {
		const { verifyRecaptcha: mockVerifyRecaptcha } = await import('../services/googleService.js');
		(mockVerifyRecaptcha as Mock).mockResolvedValue({
			data: { success: true }
		});

		const validateRecaptcha = await importMiddleware();
		mockRequest.query = { captchaResponse: 'valid-token' };

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockVerifyRecaptcha).toHaveBeenCalledWith('valid-token');
		expect(mockNext).toHaveBeenCalled();
		expect(mockResponse.status as unknown as Mock).not.toHaveBeenCalled();
	});

	it('should return 400 when captchaResponse is missing', async () => {
		const validateRecaptcha = await importMiddleware();
		mockRequest.query = {};

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return 500 when secret is not configured', async () => {
		const validateRecaptcha = await importMiddleware({ GOOGLE_RECAPTCHA_SECRET: '' });
		mockRequest.query = { captchaResponse: 'some-token' };

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(500);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return 418 when Google responds with failure', async () => {
		const { verifyRecaptcha: mockVerifyRecaptcha } = await import('../services/googleService.js');
		(mockVerifyRecaptcha as Mock).mockResolvedValue({
			data: { success: false }
		});

		const validateRecaptcha = await importMiddleware();
		mockRequest.query = { captchaResponse: 'invalid-token' };

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(418);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return 418 when verifyRecaptcha throws an error', async () => {
		const { verifyRecaptcha: mockVerifyRecaptcha } = await import('../services/googleService.js');
		const apiError = new Error('Network error');
		(mockVerifyRecaptcha as Mock).mockRejectedValue(apiError);

		const validateRecaptcha = await importMiddleware();
		mockRequest.query = { captchaResponse: 'any-token' };

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(418);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});
});
