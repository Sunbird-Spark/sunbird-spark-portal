import { Request, Response } from 'express';
import _ from 'lodash';
import { envConfig } from '../config/env.js';
import {
    verifyGoogleIdToken,
    findOrCreateGoogleUser,
    createKeycloakGoogleAndroidSession,
} from '../services/mobileAuthService.js';
import logger from '../utils/logger.js';

/**
 * POST /mobile/google/auth/android
 *
 * Google Sign-In for Android (and iOS) mobile clients.
 * The mobile app verifies the user with Google natively and sends the
 * resulting ID token to this endpoint. We verify it, find/create the
 * Sunbird user, then create a Keycloak session and return the tokens.
 *
 * Mirrors POST /google/auth/android from the reference googleSignInRoutes.js.
 *
 * Request:
 *   Header: X-GOOGLE-ID-TOKEN  — Google ID token from the native SDK
 *   Body:   { emailId: string, platform?: 'android' | 'ios' }
 *
 * Response: { access_token, refresh_token }
 */
export const handleMobileGoogleLogin = async (req: Request, res: Response): Promise<void> => {
    const idToken = req.get('X-GOOGLE-ID-TOKEN');
    const { emailId, platform } = req.body ?? {};

    if (!idToken || !emailId) {
        res.status(400).json({
            error: 'MISSING_REQUIRED_FIELDS',
            msg: 'X-GOOGLE-ID-TOKEN header and emailId body field are required',
        });
        return;
    }

    // Select the Google OAuth client ID based on platform.
    // iOS tokens are signed for the iOS client ID; Android (default) uses the standard client.
    const googleClientId =
        platform === 'ios' && envConfig.GOOGLE_OAUTH_CLIENT_ID_IOS
            ? envConfig.GOOGLE_OAUTH_CLIENT_ID_IOS
            : envConfig.GOOGLE_OAUTH_CLIENT_ID;

    try {
        // Step 1: Verify the Google ID token with the appropriate client
        let payload: { email: string; name?: string; sub: string };
        try {
            payload = await verifyGoogleIdToken(idToken, googleClientId);
        } catch (err) {
            logger.error('handleMobileGoogleLogin: Google token verification failed', err);
            res.status(400).json({ msg: 'Invalid Google ID token' });
            return;
        }

        // Step 2: Validate that the emailId in the body matches the token payload.
        // Compare in lowercase+trimmed form since email addresses are case-insensitive.
        if (_.toLower(_.trim(emailId)) !== _.toLower(_.trim(payload.email))) {
            logger.error(`handleMobileGoogleLogin: emailId mismatch — body=${emailId} token=${payload.email}`);
            res.status(400).json({ msg: 'emailId do not match' });
            return;
        }

        // Step 3: Find or create the Sunbird user (with propagation delay for new users)
        const clientId = platform === 'ios' ? 'ios' : 'android';
        try {
            await findOrCreateGoogleUser({ emailId: payload.email, name: payload.name }, clientId, req);
        } catch (err: any) {
            logger.error('handleMobileGoogleLogin: user find/create failed', err);
            if (err.message === 'USER_NAME_NOT_PRESENT') {
                res.status(400).json({
                    msg: 'Your account could not be created on SUNBIRD due to your Google Security settings',
                    error: 'USER_NAME_NOT_PRESENT',
                });
                return;
            }
            res.status(400).json({ msg: 'unable to create session', error: err.message });
            return;
        }

        // Step 4: Create a Keycloak session using the Android Google client (ROPC)
        let tokens;
        try {
            tokens = await createKeycloakGoogleAndroidSession(payload.email);
        } catch (err: any) {
            logger.error('handleMobileGoogleLogin: Keycloak session creation failed', err);
            if (err.error === 'USER_ACCOUNT_BLOCKED') {
                res.status(401).json({
                    msg: 'User account is blocked. Please contact admin',
                    error: 'USER_ACCOUNT_BLOCKED',
                });
                return;
            }
            res.status(400).json({ msg: 'unable to create session' });
            return;
        }

        logger.info(`handleMobileGoogleLogin: success for ${payload.email}`);
        res.json(tokens);
    } catch (err) {
        logger.error('handleMobileGoogleLogin: unhandled error', err);
        res.status(400).json({ msg: 'unable to create session' });
    }
};
