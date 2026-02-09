import crypto from 'crypto';
import googleOauth, {
    validateOAuthSession,
    validateOAuthCallback,
    markSessionAsUsed,
    handleUserAuthentication
} from '../services/googleAuthService.js';
import { envConfig } from '@/config/env.js';
import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';

export const initiateGoogleAuth = (req: Request, res: Response) => {
    try {
        const fields = ['client_id', 'redirect_uri', 'error_callback'];
        if (!fields.every(field => _.has(req.query, field))) {
            return res.redirect('/');
        }

        const redirectUrl = new URL(req.query.redirect_uri as string);
        const errorCallbackUrl = new URL(req.query.error_callback as string);

        if (!envConfig.DOMAIN_URL) {
            throw new Error('DOMAIN_URL is not defined');
        }
        const parsedUrl = new URL(envConfig.DOMAIN_URL);
        const ALLOWED_HOSTS = [parsedUrl.hostname];

        if (!ALLOWED_HOSTS.includes(redirectUrl.hostname)) {
            return res.status(400).send('INVALID_REDIRECT_URI');
        }

        if (!ALLOWED_HOSTS.includes(errorCallbackUrl.hostname)) {
            return res.status(400).send('INVALID_ERROR_CALLBACK_URI');
        }

        const nonce = crypto.randomBytes(32).toString('hex');
        const state = crypto.randomBytes(32).toString('hex');

        req.session.googleOAuth = {
            nonce,
            state,
            client_id: req.query.client_id as string,
            redirect_uri: req.query.redirect_uri as string,
            error_callback: req.query.error_callback as string,
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
        const errorCallback = req.query.error_callback as string || '/';
        return res.redirect(`${errorCallback}?error=GOOGLE_AUTH_INIT_FAILED`);
    }
};

export const handleGoogleAuthCallback = async (req: Request, res: Response) => {
    let redirectUrl: string = '/?error=GOOGLE_SIGN_IN_FAILED';

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
        redirectUrl =
            (req.session?.googleOAuth?.error_callback || '/') +
            '?error=GOOGLE_SIGN_IN_FAILED';
        return res.redirect(redirectUrl);
    } finally {
        delete req.session.googleOAuth;
    }
};
