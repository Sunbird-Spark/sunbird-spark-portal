import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

const isValidBase64 = (str: string): boolean => {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    
    if (!base64Regex.test(str)) {
        return false;
    }
    
    if (str.length % 4 !== 0) {
        return false;
    }
    
    try {
        const decoded = Buffer.from(str, 'base64').toString('base64');
        return decoded === str;
    } catch {
        return false;
    }
};

export const handlePassword = (req: Request, res: Response, next: NextFunction): void => {
    try {
        if (req.body?.request?.password) {
            const password = req.body.request.password;
            
            if (!isValidBase64(password)) {
                logger.warn('Invalid base64 password format received');
                res.status(400).json({
                    error: 'Invalid password format',
                    message: 'Password must be base64 encoded'
                });
                return;
            }
            
            req.body.request.password = Buffer.from(password, 'base64').toString('utf-8');
        }
        next();
    } catch (error) {
        logger.error('Error in password handler middleware:', error);
        next(error);
    }
};
