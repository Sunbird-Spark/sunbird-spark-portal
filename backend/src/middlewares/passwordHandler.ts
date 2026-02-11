import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const handlePassword = (req: Request, _res: Response, next: NextFunction): void => {
    try {
        if (req.body?.request?.password) {
            req.body.request.password = Buffer.from(req.body.request.password, 'base64').toString('utf-8');
            logger.info('Password decoded successfully');
        }
        next();
    } catch (error) {
        logger.error('Error in password handler middleware:', error);
        next(error);
    }
};
