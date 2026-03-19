import { Request, Response } from 'express';
import { keycloakNativeLogin } from '../services/mobileAuthService.js';
import logger from '../utils/logger.js';

/**
 * POST /mobile/keycloak/login
 *
 * Native username/password login for Android/mobile clients using ROPC.
 * Returns access_token + refresh_token directly (no session created).
 *
 * Replaces the HTML form-scraping flow in the reference keycloakSignInRoutes.js
 * with a direct OIDC ROPC call to the Keycloak token endpoint.
 */
export const handleMobileKeycloakLogin = async (req: Request, res: Response): Promise<void> => {
    const { emailId, password } = req.body ?? {};

    if (!emailId || !password) {
        logger.info('handleMobileKeycloakLogin: missing emailId or password');
        res.status(400).json({
            error: 'MISSING_REQUIRED_FIELDS',
            error_msg: 'emailId and password are required',
        });
        return;
    }

    try {
        const tokens = await keycloakNativeLogin(emailId, password);
        logger.info('handleMobileKeycloakLogin: login successful');
        res.json(tokens);
    } catch (err: any) {
        logger.error('handleMobileKeycloakLogin: login failed', err);

        if (err.error === 'USER_ACCOUNT_BLOCKED') {
            res.status(401).json({ error: err.error, error_msg: err.error_msg });
            return;
        }

        res.status(err.statusCode || 401).json({
            error: err.error || 'LOGIN_FAILED',
            error_msg: err.error_msg || 'Login failed',
        });
    }
};
