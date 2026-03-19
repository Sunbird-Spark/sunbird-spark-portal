import { Request, Response as ExpressResponse } from 'express';
import { decodeJwtPayload } from '../auth/oidcProvider.js';
import {
    getMobileClients,
    verifyEchoAuthToken,
    refreshMobileToken,
} from '../services/mobileAuthService.js';
import { Response } from '../models/Response.js';
import logger from '../utils/logger.js';

/**
 * POST /mobile/auth/v1/refresh/token
 *
 * Refreshes Keycloak tokens for mobile clients.
 * Validates the client is whitelisted, verifies the caller's auth token
 * via the echo API, then forwards to Keycloak's refresh_token endpoint.
 *
 * Mirrors the reference refreshTokenRoutes.js.
 *
 * Request:
 *   Header: Authorization — current bearer token (validated via echo API)
 *   Body:   { refresh_token: string }
 *
 * Response: standardised Sunbird envelope with { access_token, refresh_token, ... }
 */
export const handleMobileTokenRefresh = async (req: Request, res: ExpressResponse): Promise<void> => {
    logger.info('handleMobileTokenRefresh: called');

    const { refresh_token: refreshToken } = req.body ?? {};

    if (!refreshToken) {
        logger.error('handleMobileTokenRefresh: refresh_token missing');
        const response = new Response('api.refresh.token');
        response.setError({ err: 'REFRESH_TOKEN_REQUIRED', errmsg: 'refresh_token is required', responseCode: 'CLIENT_ERROR' });
        res.status(400).json(response);
        return;
    }

    // Decode JWT payload to identify which Keycloak client issued the token
    const decoded = decodeJwtPayload(refreshToken);
    if (!decoded) {
        logger.error('handleMobileTokenRefresh: invalid JWT payload');
        const response = new Response('api.refresh.token');
        response.setError({ err: 'INVALID_REFRESH_TOKEN', errmsg: 'refresh_token is invalid', responseCode: 'CLIENT_ERROR' });
        res.status(400).json(response);
        return;
    }

    // aud can be a string or array — normalise to string for client lookup
    const rawAud = decoded['aud'];
    const aud: string | undefined = Array.isArray(rawAud) ? rawAud[0] : rawAud;

    const mobileClients = getMobileClients();
    const clientDetails = aud ? mobileClients[aud] : undefined;

    if (!clientDetails) {
        logger.error(`handleMobileTokenRefresh: unknown client aud=${aud}`);
        const response = new Response('api.refresh.token');
        response.setError({ err: 'INVALID_CLIENT', errmsg: 'client not supported', responseCode: 'CLIENT_ERROR' });
        res.status(400).json(response);
        return;
    }

    try {
        // Verify the caller's current bearer token against the echo API
        const authorization = req.get('authorization') ?? '';
        await verifyEchoAuthToken(authorization);

        // Refresh tokens with Keycloak
        const tokenResponse = await refreshMobileToken(clientDetails, refreshToken);

        logger.info('handleMobileTokenRefresh: success');
        const response = new Response('api.refresh.token');
        response.setResult({ data: tokenResponse });
        res.json(response);
    } catch (err: any) {
        logger.error('handleMobileTokenRefresh: failed', err);
        const response = new Response('api.refresh.token');
        response.setError({
            err: err.error || 'UNHANDLED_EXCEPTION',
            errmsg: err.error_msg || err.message || 'Something went wrong',
            responseCode: err.statusCode >= 400 && err.statusCode < 500 ? 'CLIENT_ERROR' : 'SERVER_ERROR',
        });
        res.status(err.statusCode || 500).json(response);
    }
};
