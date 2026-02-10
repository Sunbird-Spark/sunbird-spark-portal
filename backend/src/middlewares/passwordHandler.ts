import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Middleware to handle bcrypt hashed passwords for signup flows
 * 
 * Frontend sends bcrypt hashed passwords for security.
 * Backend passes the hashed password directly to the proxy/Kong.
 * Kong will store the bcrypt hash in the database.
 * 
 * This middleware:
 * 1. Receives bcrypt hashed password from frontend
 * 2. Validates that it looks like a bcrypt hash
 * 3. Passes it through to Kong/proxy as-is
 */
export const handlePasswordForSignup = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // For signup requests, validate the bcrypt hash format
        if (req.body?.request?.password) {
            const password = req.body.request.password;
            
            // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
            const bcryptPattern = /^\$2[aby]\$\d{2}\$.{53}$/;
            
            if (!bcryptPattern.test(password)) {
                logger.warn('Password does not appear to be a valid bcrypt hash');
                // Still allow it through - Kong will validate
            } else {
                logger.info('Valid bcrypt hashed password received for signup');
            }
        }
        
        next();
    } catch (error) {
        logger.error('Error in password handler middleware:', error);
        next(error);
    }
};

/**
 * Middleware to handle bcrypt hashed passwords for password reset flows
 */
export const handlePasswordForReset = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // For password reset, validate the bcrypt hash if a new password is provided
        if (req.body?.request?.password) {
            const password = req.body.request.password;
            
            const bcryptPattern = /^\$2[aby]\$\d{2}\$.{53}$/;
            
            if (!bcryptPattern.test(password)) {
                logger.warn('Password does not appear to be a valid bcrypt hash');
            } else {
                logger.info('Valid bcrypt hashed password received for reset');
            }
        }
        
        next();
    } catch (error) {
        logger.error('Error in password reset handler middleware:', error);
        next(error);
    }
};
