import express, { Request, Response } from 'express';
import * as oidcClient from 'openid-client';
import { getPortalOIDCConfig, decodeJwtPayload } from '../auth/oidcProvider.js';
import logger from '../utils/logger.js';
import { regenerateSession, regenerateAnonymousSession, saveSession } from '../utils/sessionUtils.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';
import { fetchUserById, setUserSession } from '../services/userService.js';
import { envConfig } from '../config/env.js';
import { sessionMiddleware } from '../middlewares/conditionalSession.js';
import crypto from 'crypto';
import _ from 'lodash';

const router = express.Router();

router.get('/login',
    sessionMiddleware,
    async (req: Request, res: Response) => {
        logger.info('DEBUG: /portal/login hit ' + JSON.stringify({
            url: req.url,
            query: req.query,
            sessionID: req.sessionID ? '[REDACTED]' : undefined,
            cookie: req.headers.cookie ? '[REDACTED]' : undefined,
            hasSession: !!req.session,
            hasOidc: !!req.oidc?.isAuthenticated
        }));

        // If already authenticated, go home
        if (req.session?.['oidc-tokens']?.access_token) {
            logger.info('User already authenticated, redirecting to home');
            return res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL + '/home');
        }

        try {
            const config = await getPortalOIDCConfig();

            // Generate PKCE challenge
            const codeVerifier = oidcClient.randomPKCECodeVerifier();
            const codeChallenge = await oidcClient.calculatePKCECodeChallenge(codeVerifier);

            // Generate state for CSRF protection
            const state = crypto.randomUUID();

            // Store PKCE verifier and state in session for callback validation
            req.session.oidcCodeVerifier = codeVerifier;
            req.session.oidcState = state;
            await saveSession(req);

            // Build authorization URL using OIDC Discovery endpoints
            const callbackUrl = `${envConfig.DOMAIN_URL}/portal/auth/callback`;
            const promptParam = req.query.prompt as string | undefined;
            const redirectTo = oidcClient.buildAuthorizationUrl(config, {
                redirect_uri: callbackUrl,
                scope: 'openid',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                state: state,
                ...(promptParam ? { prompt: promptParam } : {}),
            });

            logger.info('Redirecting to OIDC provider for login');
            res.redirect(redirectTo.href);
        } catch (err) {
            logger.error('Error initiating OIDC login', err);
            res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL || '/');
        }
    }
);

router.get('/auth/callback',
    sessionMiddleware,
    async (req: Request, res: Response) => {
        logger.info('Entered /portal/auth/callback handler');

        // Handle error responses from the OIDC provider (e.g. prompt=none with no SSO session)
        if (req.query.error) {
            const error = req.query.error as string;
            logger.warn(`OIDC callback received error: ${error}`);

            // login_required / interaction_required means prompt=none was used
            // but the user has no active SSO session — fall back to interactive login
            if (error === 'login_required' || error === 'interaction_required') {
                return res.redirect('/portal/login');
            }

            // For other errors, redirect to home
            return res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL || '/');
        }

        // Validate required session parameters and authorization code
        if (!req.query.code) {
            logger.warn('Callback received without authorization code. Restarting login flow.');
            return res.redirect('/portal/login');
        }

        if (!req.session.oidcCodeVerifier || !req.session.oidcState) {
            logger.warn('Callback received without PKCE verifier or state in session. Restarting login flow.');
            delete req.session.oidcCodeVerifier;
            delete req.session.oidcState;
            return res.redirect('/portal/login');
        }

        try {
            const config = await getPortalOIDCConfig();

            // Reconstruct the current URL for openid-client to extract code/state from
            const currentUrl = new URL(
                `${req.protocol}://${req.get('host')}${req.originalUrl}`
            );

            // Exchange the authorization code for tokens
            const callbackUrl = `${envConfig.DOMAIN_URL}/portal/auth/callback`;
            const tokens = await oidcClient.authorizationCodeGrant(config, currentUrl, {
                pkceCodeVerifier: req.session.oidcCodeVerifier,
                expectedState: req.session.oidcState,
                idTokenExpected: true,
            }, { redirect_uri: callbackUrl });

            // Clean up PKCE/state from session
            delete req.session.oidcCodeVerifier;
            delete req.session.oidcState;

            // Store tokens in session
            req.session['oidc-tokens'] = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                id_token: tokens.id_token,
            };

            // Attach to req.oidc for downstream use
            const tokenClaims = decodeJwtPayload(tokens.access_token);
            const refreshClaims = tokens.refresh_token
                ? decodeJwtPayload(tokens.refresh_token)
                : undefined;

            req.oidc = {
                isAuthenticated: true,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                idToken: tokens.id_token,
                tokenClaims: tokenClaims || undefined,
                refreshTokenClaims: refreshClaims || undefined,
            };

            logger.info('OIDC authenticated successfully');

            if (req.session) {
                // Regenerate session (this persists the tokens)
                await regenerateSession(req);
                setSessionTTLFromToken(req);

                // Initialize user session from token subject
                const tokenSubject = req.oidc?.tokenClaims?.sub;
                if (tokenSubject) {
                    const userIdFromToken = _.last(_.split(tokenSubject, ':'));
                    req.session.userId = userIdFromToken;

                    if (userIdFromToken) {
                        const userProfileResponse = await fetchUserById(userIdFromToken, req);
                        await setUserSession(req, userProfileResponse);
                    }
                }

                logger.info('Session setup complete, redirecting to /home');
                res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL + '/home');
            } else {
                logger.error('No session found after OIDC callback');
                res.redirect('/');
            }
        } catch (err) {
            logger.error('Error in OIDC callback', err);
            // Clean up PKCE/state from session on failure
            delete req.session?.oidcCodeVerifier;
            delete req.session?.oidcState;
            res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL || '/');
        }
    }
);

router.all('/logout', sessionMiddleware, async (req: Request, res: Response) => {
    // Extract ID token before clearing session so we can pass it to the provider
    const idToken = req.session?.['oidc-tokens']?.id_token;
    const redirectUri = envConfig.DEVELOPMENT_REACT_APP_URL || envConfig.SERVER_URL + '/';

    try {
        await regenerateAnonymousSession(req);
    } catch (err) {
        logger.error('Error regenerating session on logout', err);
        // Continue with provider logout even if local session clear failed
    }

    // Redirect to OIDC provider logout
    try {
        const config = await getPortalOIDCConfig();
        const logoutUrl = oidcClient.buildEndSessionUrl(config, {
            post_logout_redirect_uri: redirectUri,
            ...(idToken ? { id_token_hint: idToken } : {}),
        });
        res.redirect(logoutUrl.href);
    } catch {
        // Fallback: construct logout URL from known OIDC issuer pattern
        const logoutUrl = `${envConfig.DOMAIN_URL}/auth/realms/${envConfig.PORTAL_REALM}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(redirectUri)}`;
        res.redirect(logoutUrl);
    }
});

export default router;
