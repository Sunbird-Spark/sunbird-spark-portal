import { Request, Response, NextFunction } from 'express';
import { v1 as uuidv1 } from 'uuid';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import _ from 'lodash';
import { verifyRecaptcha } from '../services/googleService.js';

export const validateRecaptcha = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const captchaResponse = _.get(req.query, 'captchaResponse', '') as string;
		if (!captchaResponse) {
			logger.error(`GOOGLE_RECAPTCHA :: missing captchaResponse in query params`);
			throw new Error('MISSING_CAPTCHA_RESPONSE');
		}

		if (!envConfig.GOOGLE_RECAPTCHA_SECRET) {
			logger.error(`GOOGLE_RECAPTCHA :: missing secret in config`);
			throw new Error('GOOGLE_RECAPTCHA_SECRET not configured');
		}

		const response = await verifyRecaptcha(captchaResponse);

		if (!_.get(response, 'data.success')) {
			logger.error(`GOOGLE_RECAPTCHA :: captcha validation failed`);
			throw new Error('CAPTCHA_VALIDATION_FAILED');
		}

		return next();
	} catch (error: unknown) {
		logger.error(`GOOGLE_RECAPTCHA :: validateRecaptcha caught exception`, error);
		res.status(418).send({
			id: 'api.validate.recaptcha',
			ts: new Date(),
			params: {
				resmsgid: uuidv1(),
				msgid: uuidv1(),
				err: "I'm a teapot",
				status: "I'm a teapot",
				errmsg: "I'm a teapot"
			},
			responseCode: "I'm a teapot",
			result: {}
		});
	}
};

