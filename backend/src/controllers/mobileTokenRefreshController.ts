import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { decodeJwtPayload } from '../auth/oidcProvider.js';
import {
    getMobileClients,
    verifyEchoAuthToken,
    refreshMobileToken,
} from '../services/mobileAuthService.js';
import logger from '../utils/logger.js';

const buildResponse = (status: 'SUCCESS' | 'FAILED', result: unknown, error?: { err: string; errmsg: string }) => ({
    id: 'api.refresh.token',
    ver: '1.0',
    ts: new Date().toISOString(),
    params: {
        resmsgid: uuidv4(),
        status,
        ...(error ?? {}),
    },
    responseCode: error?.errmsg ?? 'OK',
    result: status === 'SUCCESS' ? result : {},
});

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
export const handleMobileTokenRefresh = async (req: Request, res: Response): Promise<void> => {
    logger.info('handleMobileTokenRefresh: called');

    const { refresh_token: refreshToken } = req.body ?? {};

    if (!refreshToken) {
        logger.error('handleMobileTokenRefresh: refresh_token missing');
        res.status(400).json(
            buildResponse('FAILED', {}, { err: 'refresh_token is required', errmsg: 'REFRESH_TOKEN_REQUIRED' })
        );
        return;
    }

    // Decode JWT payload to identify which Keycloak client issued the token
    const decoded = decodeJwtPayload(refreshToken);
    if (!decoded) {
        logger.error('handleMobileTokenRefresh: invalid JWT payload');
        res.status(400).json(
            buildResponse('FAILED', {}, { err: 'refresh_token is invalid', errmsg: 'INVALID_REFRESH_TOKEN' })
        );
        return;
    }

    // aud can be a string or array — normalise to string for client lookup
    const rawAud = decoded['aud'];
    const aud: string | undefined = Array.isArray(rawAud) ? rawAud[0] : rawAud;

    const mobileClients = getMobileClients();
    const clientDetails = aud ? mobileClients[aud] : undefined;

    if (!clientDetails) {
        logger.error(`handleMobileTokenRefresh: unknown client aud=${aud}`);
        res.status(400).json(
            buildResponse('FAILED', {}, { err: 'client not supported', errmsg: 'INVALID_CLIENT' })
        );
        return;
    }

    try {
        // Verify the caller's current bearer token against the echo API
        const authorization = req.get('authorization') ?? '';
        await verifyEchoAuthToken(authorization);

        // Refresh tokens with Keycloak
        const tokenResponse = await refreshMobileToken(clientDetails, refreshToken);

        logger.info('handleMobileTokenRefresh: success');
        res.json(buildResponse('SUCCESS', tokenResponse));
    } catch (err: any) {
        logger.error('handleMobileTokenRefresh: failed', err);
        const errMsg = err.error_msg || err.message || 'Something went wrong';
        const errCode = err.error || 'UNHANDLED_EXCEPTION';
        res.status(err.statusCode || 500).json(
            buildResponse('FAILED', {}, { err: errMsg, errmsg: errCode })
        );
    }
};
