import crypto from 'crypto';
import * as oidcClient from 'openid-client';
import {
    validateOAuthSession,
    validateOAuthCallback,
    markSessionAsUsed,
    handleUserAuthentication,
    validateRedirectUrl,
} from '../services/oauthSessionUtils.js';
import { createKeycloakSsoSession } from '../services/keycloakSsoBridgeService.js';
import { ssoProviders } from '../services/ssoProviders.js';
import { validateSsoConfig } from '../bootstrap/validateSsoConfig.js';
import { regenerateSession, saveSession } from '../utils/sessionUtils.js';
import { fetchUserById, setUserSession } from '../services/userService.js';
import { envConfig } from '../config/env.js';
import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.js';
import _ from 'lodash';

export const initiateSsoAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const provider = req.params.provider as string;
        // Unregistered provider name — not an SSO route at all, let it fall
        // through to later middleware (SPA catch-all / proxy) instead of
        // shadowing unrelated two-segment paths like /content/auth.
        if (!ssoProviders[provider]) {
            return next();
        }
        if (!validateSsoConfig().includes(provider)) {
            return res.status(404).send('SSO_PROVIDER_NOT_FOUND');
        }

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

        req.session.ssoOAuth = {
            provider,
            codeVerifier,
            state,
            client_id: req.query.client_id as string,
            redirect_uri: validatedRedirectUri,
            error_callback: validatedErrorCallback,
            timestamp: Date.now(),
            sessionUsed: false,
        };

        const authUrl = ssoProviders[provider].buildAuthUrl(state, codeChallenge);
        return res.redirect(authUrl);
    } catch (error) {
        logger.error('Error initializing SSO OAuth:', error);
        const errorCallback = validateRedirectUrl(req.query.error_callback as string);
        return res.redirect(`${errorCallback}?error=SSO_AUTH_INIT_FAILED`);
    }
};

export const handleSsoAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const provider = req.params.provider as string;
        // Unregistered provider name — not an SSO route at all, let it fall
        // through to later middleware (SPA catch-all / proxy) instead of
        // shadowing unrelated two-segment paths like /content/auth/callback.
        if (!ssoProviders[provider]) {
            return next();
        }
        if (!validateSsoConfig().includes(provider)) {
            return res.status(404).send('SSO_PROVIDER_NOT_FOUND');
        }

        const { state, codeVerifier, client_id } = validateOAuthSession(req);

        if (req.session.ssoOAuth?.provider !== provider) {
            return res.status(400).send('SSO_PROVIDER_MISMATCH');
        }

        // Capture redirect_uri before session cleanup in finally
        const redirectUri = req.session.ssoOAuth?.redirect_uri;

        const code = validateOAuthCallback(req, state);

        markSessionAsUsed(req);

        // Step 1: Exchange provider auth code → real email/name from the provider's ID token
        const ssoUser = await ssoProviders[provider].exchangeCode(code, codeVerifier);

        // Step 2: Create/find user in Sunbird
        await handleUserAuthentication(ssoUser, client_id, req);

        // Step 3: Create Keycloak session directly using ROPC grant with the
        // provider's KEYCLOAK_<PROVIDER>_CLIENT_ID/SECRET — mirrors obtainDirectly(emailId)
        // from the reference SunbirdEd portal implementation
        const tokens = await createKeycloakSsoSession(
            provider,
            ssoUser.emailId!,
            ssoProviders[provider].keycloakClientId,
            ssoProviders[provider].keycloakClientSecret
        );

        // Step 4: Set up portal session (same as portalAuthRoutes.ts callback)
        req.session['oidc-tokens'] = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id_token: tokens.id_token,
        };

        req.oidc = {
            isAuthenticated: true,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
            tokenClaims: tokens.tokenClaims || undefined,
        };

        await regenerateSession(req);

        const tokenSubject = tokens.tokenClaims?.sub as string | undefined;
        if (tokenSubject) {
            const userIdFromToken = _.last(_.split(tokenSubject, ':'));
            req.session.userId = userIdFromToken;

            if (userIdFromToken) {
                try {
                    const userProfileResponse = await fetchUserById(userIdFromToken, req);
                    await setUserSession(req, userProfileResponse);
                } catch (userErr) {
                    logger.error('Failed to fetch user profile during SSO callback:', userErr);
                }
            }
        }

        await saveSession(req);

        const homeUrl = (envConfig.DEVELOPMENT_REACT_APP_URL || '') + '/home';
        const destination = redirectUri || homeUrl;
        return res.redirect(destination);
    } catch (error) {
        logger.error('Error in SSO OAuth callback:', error);
        const safeErrorCallback = validateRedirectUrl(req.session?.ssoOAuth?.error_callback);
        return res.redirect(`${safeErrorCallback}?error=SSO_SIGN_IN_FAILED`);
    } finally {
        delete req.session.ssoOAuth;
    }
};
