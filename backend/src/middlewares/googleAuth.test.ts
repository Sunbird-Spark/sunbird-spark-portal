import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

vi.mock('axios');
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
		return module.validateRecaptcha as (req: Request, res: Response, next: NextFunction) => Promise<void>;
	};

	it('captcha is valid: should call the next function', async () => {
		const validateRecaptcha = await importMiddleware();
		mockRequest.query = { captchaResponse: 'valid-token' };

		(axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
			data: { success: true }
		});

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(axios.post).toHaveBeenCalledWith(
			`${baseEnvConfig.GOOGLE_RECAPTCHA_VERIFY_URL}?secret=test-secret&response=valid-token`
		);
		expect(mockNext).toHaveBeenCalled();
		expect(mockResponse.status as unknown as Mock).not.toHaveBeenCalled();
	});

	it('should return 418 when captchaResponse is missing', async () => {
		const validateRecaptcha = await importMiddleware();
		mockRequest.query = {};

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(418);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return 418 when secret is not configured', async () => {
		const validateRecaptcha = await importMiddleware({ GOOGLE_RECAPTCHA_SECRET: '' });
		mockRequest.query = { captchaResponse: 'some-token' };

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(418);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return 418 when Google responds with failure', async () => {
		const validateRecaptcha = await importMiddleware();
		mockRequest.query = { captchaResponse: 'invalid-token' };

		(axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
			data: { success: false }
		});

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(418);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return 418 when axios throws an error', async () => {
		const validateRecaptcha = await importMiddleware();
		mockRequest.query = { captchaResponse: 'any-token' };

		const apiError = new Error('Network error');
		(axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

		await validateRecaptcha(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(418);
		expect(mockResponse.send).toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
	});
});
