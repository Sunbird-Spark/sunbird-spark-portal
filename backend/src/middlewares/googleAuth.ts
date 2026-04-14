import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import _ from 'lodash';
import { verifyRecaptcha } from '../services/googleService.js';

const recaptchaSecret = envConfig.GOOGLE_RECAPTCHA_SECRET;

class HttpError extends Error {
	statusCode: number;
	errorCode: string;
	responseCode: string;

	constructor(errorCode: string, statusCode: number, responseCode: string, message?: string) {
		super(message ?? errorCode);
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.responseCode = responseCode;
	}
}

export const validateRecaptcha = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const captchaResponse = _.get(req.query, 'captchaResponse', '') as string;
		if (!captchaResponse) {
			logger.error(`GOOGLE_RECAPTCHA :: missing captchaResponse in query params`);
			throw new HttpError('MISSING_CAPTCHA_RESPONSE', 400, 'BAD_REQUEST', 'Captcha response is required');
		}

		if (!recaptchaSecret) {
			logger.error(`GOOGLE_RECAPTCHA :: missing secret in config`);
			throw new HttpError('RECAPTCHA_SECRET_NOT_CONFIGURED', 500, 'INTERNAL_SERVER_ERROR', 'Recaptcha secret is not configured');
		}

		const response = await verifyRecaptcha(captchaResponse);

		if (!_.get(response, 'data.success')) {
			logger.error(`GOOGLE_RECAPTCHA :: captcha validation failed`, response);
			throw new HttpError('CAPTCHA_VALIDATION_FAILED', 418, 'I_AM_A_TEAPOT', 'Captcha validation failed');
		}

		next();
	} catch (error: unknown) {
		logger.error(`GOOGLE_RECAPTCHA :: validateRecaptcha caught exception`, error);
		const httpError = error instanceof HttpError ? error : new HttpError("CAPTCHA_VALIDATION_FAILED", 418, 'I_AM_A_TEAPOT', 'Recaptcha validation failed');

		res.status(httpError.statusCode).send({
			id: 'api.validate.recaptcha',
			ts: new Date(),
			params: {
				resmsgid: uuidv4(),
				msgid: uuidv4(),
				status: 'FAILED'
			},
			responseCode: httpError.responseCode,
			error: {
				code: httpError.errorCode,
				message: httpError.message
			}
		});

	}
};

