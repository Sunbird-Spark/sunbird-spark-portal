import { Request, Response, NextFunction } from 'express';
import * as client from 'openid-client';
import { getPortalOIDCConfig, decodeJwtPayload } from './oidcProvider.js';
import logger from '../utils/logger.js';
import { saveSession } from '../utils/sessionUtils.js';

/**
 * Middleware that deserializes OIDC tokens from the session and attaches them to `req.oidc`.
 * If the access token is expired but a refresh token is available, it transparently refreshes.
 * This replaces keycloak.middleware().
 */
export function oidcSession() {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const tokens = req.session?.['oidc-tokens'];

            if (!tokens?.access_token) {
                req.oidc = { isAuthenticated: false };
                return next();
            }

            const tokenClaims = decodeJwtPayload(tokens.access_token);
            const now = Math.floor(Date.now() / 1000);

            // If access token is expired and we have a refresh token, try to refresh
            if (tokenClaims?.exp && tokenClaims.exp < now && tokens.refresh_token) {
                try {
                    const config = await getPortalOIDCConfig();
                    const newTokens = await client.refreshTokenGrant(config, tokens.refresh_token);

                    tokens.access_token = newTokens.access_token;
                    if (newTokens.refresh_token) tokens.refresh_token = newTokens.refresh_token;
                    if (newTokens.id_token) tokens.id_token = newTokens.id_token;
                    req.session['oidc-tokens'] = tokens;

                    // Explicitly persist refreshed tokens so they survive request failures
                    await saveSession(req);

                    const newClaims = decodeJwtPayload(tokens.access_token);
                    const refreshClaims = tokens.refresh_token
                        ? decodeJwtPayload(tokens.refresh_token)
                        : undefined;

                    req.oidc = {
                        isAuthenticated: true,
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        idToken: tokens.id_token,
                        tokenClaims: newClaims || undefined,
                        refreshTokenClaims: refreshClaims || undefined,
                    };

                    logger.info('OIDC access token refreshed successfully');
                } catch (err) {
                    logger.error('OIDC token refresh failed, clearing auth state', err);
                    req.oidc = { isAuthenticated: false };
                    delete req.session['oidc-tokens'];
                }
            } else {
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
            }

            next();
        } catch (err) {
            logger.error('Error in OIDC session middleware', err);
            req.oidc = { isAuthenticated: false };
            next();
        }
    };
}

/**
 * Middleware that requires the user to be authenticated.
 * - XHR/API requests (req.xhr or Accept contains application/json): returns 401 JSON
 *   to prevent redirect loops when the browser re-issues non-GET methods.
 * - Browser navigations: redirects to /portal/login?prompt=none.
 * This replaces keycloak.protect().
 */
export function requireAuth() {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.oidc?.isAuthenticated) {
            return next();
        }
        // XHR/API requests must receive 401 — not a redirect — to prevent
        // the browser from following the 302 with the original method (e.g. PATCH),
        // which would miss the GET-only /login route and loop back here indefinitely.
        const isApiRequest = req.xhr || Boolean(req.accepts('json'));
        if (isApiRequest) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        res.redirect('/portal/login?prompt=none');
    };
}
