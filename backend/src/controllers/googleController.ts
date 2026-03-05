import crypto from 'crypto';
import * as oidcClient from 'openid-client';
import {
    validateOAuthSession,
    validateOAuthCallback,
    markSessionAsUsed,
    handleUserAuthentication,
    validateRedirectUrl,
    buildKeycloakGoogleAuthUrl,
    exchangeKeycloakCode,
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

        const authUrl = await buildKeycloakGoogleAuthUrl(req, state, codeChallenge);
        return res.redirect(authUrl);
    } catch (error) {
        logger.error('Error initializing Google OAuth via Keycloak:', error);
        const errorCallback = validateRedirectUrl(req.query.error_callback as string);
        return res.redirect(`${errorCallback}?error=GOOGLE_AUTH_INIT_FAILED`);
    }
};

export const handleGoogleAuthCallback = async (req: Request, res: Response) => {
    try {
        const { state, codeVerifier, client_id } = validateOAuthSession(req);

        validateOAuthCallback(req, state);

        markSessionAsUsed(req);

        // Exchange the Keycloak auth code for a token — Keycloak acted as Google IDP broker
        const googleUser = await exchangeKeycloakCode(req, codeVerifier, state);

        await handleUserAuthentication(googleUser, client_id, req);

        // Redirect to portal login. Keycloak has an active SSO session from the Google IDP
        // flow above, so /portal/login (which sends prompt=none by default) will complete
        // silently and issue a portal-scoped access token without showing the login form.
        return res.redirect('/portal/login');
    } catch (error) {
        logger.error('Error in Google OAuth callback:', error);
        const safeErrorCallback = validateRedirectUrl(req.session?.googleOAuth?.error_callback);
        return res.redirect(`${safeErrorCallback}?error=GOOGLE_SIGN_IN_FAILED`);
    } finally {
        delete req.session.googleOAuth;
    }
};
