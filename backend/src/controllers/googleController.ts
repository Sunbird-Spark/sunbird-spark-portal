import crypto from 'crypto';
import * as oidcClient from 'openid-client';
import {
    validateOAuthSession,
    validateOAuthCallback,
    markSessionAsUsed,
    handleUserAuthentication,
    validateRedirectUrl,
    buildGoogleAuthUrl,
    exchangeGoogleCode,
} from '../services/googleAuthService.js';
import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';

export const initiateGoogleAuth = async (req: Request, res: Response) => {
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

        const state = crypto.randomUUID();
        const codeVerifier = oidcClient.randomPKCECodeVerifier();
        const codeChallenge = await oidcClient.calculatePKCECodeChallenge(codeVerifier);

        req.session.googleOAuth = {
            codeVerifier,
            state,
            client_id: req.query.client_id as string,
            redirect_uri: validatedRedirectUri,
            error_callback: validatedErrorCallback,
            timestamp: Date.now(),
            sessionUsed: false,
        };

        const authUrl = buildGoogleAuthUrl(state, codeChallenge);
        return res.redirect(authUrl);
    } catch (error) {
        logger.error('Error initializing Google OAuth:', error);
        const errorCallback = validateRedirectUrl(req.query.error_callback as string);
        return res.redirect(`${errorCallback}?error=GOOGLE_AUTH_INIT_FAILED`);
    }
};

export const handleGoogleAuthCallback = async (req: Request, res: Response) => {
    try {
        const { state, codeVerifier, client_id } = validateOAuthSession(req);

        const code = validateOAuthCallback(req, state);

        markSessionAsUsed(req);

        // Exchange the Google authorization code for tokens and extract email/name
        // directly from Google's ID token — no Keycloak broker, no SPI masking.
        const googleUser = await exchangeGoogleCode(code, codeVerifier);

        await handleUserAuthentication(googleUser, client_id, req);

        // Redirect to portal login with kc_idp_hint=google.
        // The user just authenticated with Google so the browser has an active
        // Google session. Keycloak will use it for silent SSO (prompt=none default)
        // and issue a portal-scoped access token without showing a login form.
        return res.redirect('/portal/login?kc_idp_hint=google');
    } catch (error) {
        logger.error('Error in Google OAuth callback:', error);
        const safeErrorCallback = validateRedirectUrl(req.session?.googleOAuth?.error_callback);
        return res.redirect(`${safeErrorCallback}?error=GOOGLE_SIGN_IN_FAILED`);
    } finally {
        delete req.session.googleOAuth;
    }
};
