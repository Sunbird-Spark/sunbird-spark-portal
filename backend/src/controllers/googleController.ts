import crypto from 'crypto';
import googleOauth, {
    validateOAuthSession,
    validateOAuthCallback,
    markSessionAsUsed,
    handleUserAuthentication,
    validateRedirectUrl
} from '../services/googleAuthService.js';
import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';

export const initiateGoogleAuth = (req: Request, res: Response) => {
    try {
        const fields = ['client_id', 'redirect_uri', 'error_callback'];
        if (!fields.every(field => _.has(req.query, field))) {
            return res.redirect('/');
        }

        const redirectUri = req.query.redirect_uri as string;
        const errorCallback = req.query.error_callback as string;

        const validatedRedirectUri = validateRedirectUrl(redirectUri);
        const validatedErrorCallback = validateRedirectUrl(errorCallback);

        if (validatedRedirectUri === '/' || validatedErrorCallback === '/') {
            return res.status(400).send('INVALID_REDIRECT_URI_OR_ERROR_CALLBACK');
        }

        const nonce = crypto.randomBytes(32).toString('hex');
        const state = crypto.randomBytes(32).toString('hex');

        req.session.googleOAuth = {
            nonce,
            state,
            client_id: req.query.client_id as string,
            redirect_uri: validatedRedirectUri,
            error_callback: validatedErrorCallback,
            timestamp: Date.now(),
            sessionUsed: false
        };

        const authUrl = googleOauth.generateAuthUrl({
            nonce,
            state,
            req
        });

        return res.redirect(authUrl);
    } catch (error) {
        logger.error('Error initializing Google OAuth:', error);
        const errorCallback = validateRedirectUrl(req.query.error_callback as string);
        return res.redirect(`${errorCallback}?error=GOOGLE_AUTH_INIT_FAILED`);
    }
};

export const handleGoogleAuthCallback = async (req: Request, res: Response) => {
    let redirectUrl: string;

    try {
        const { state, nonce, client_id } = validateOAuthSession(req);

        const code = validateOAuthCallback(req, state);

        markSessionAsUsed(req);

        const googleUser = await googleOauth.verifyAndGetProfile({
            code,
            nonce,
            req
        });

        const userExists = await handleUserAuthentication(googleUser, client_id, req, res);

        redirectUrl = userExists ? '/home' : '/onboarding';
        return res.redirect(redirectUrl);
    } catch (error) {
        logger.error('Error in Google OAuth callback:', error);
        const safeErrorCallback = validateRedirectUrl(req.session?.googleOAuth?.error_callback);
        redirectUrl = `${safeErrorCallback}?error=GOOGLE_SIGN_IN_FAILED`;
        return res.redirect(redirectUrl);
    } finally {
        delete req.session.googleOAuth;
    }
};
