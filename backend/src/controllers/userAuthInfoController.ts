import { Request, Response } from 'express';
import { Response as ApiResponse } from '../models/Response.js';
import logger from '../utils/logger.js';
import { saveSession } from '../utils/sessionUtils.js';

/**
 * GET /portal/user/v1/auth/info
 * Returns the session ID (sid) and user ID (uid) based on the current session state.
 * For authenticated users: returns both sid and uid
 * For anonymous users: returns sid with uid as null
 */
export const getAuthInfo = async (req: Request, res: Response) => {
    const apiId = 'api.user.auth.info';
    const response = new ApiResponse(apiId);

    try {
        const deviceId = req.headers['x-device-id'] as string;

        if (deviceId && !req.session.deviceId) {
            req.session.deviceId = deviceId;
            await saveSession(req);
            logger.info(`AUTH_STATUS :: Device ID stored in session: ${deviceId}`);
        }

        if (deviceId) {
            logger.info(`AUTH_STATUS :: Request from device ID: ${deviceId}`);
        }

        const sessionId = req.sessionID;
        const userId = req.session.userId || null;
        const isAuthenticated = !!(req.session.userId && req.kauth);

        logger.info(`AUTH_STATUS :: Session ID: ${sessionId}, User ID: ${userId}, Authenticated: ${isAuthenticated}, Device ID: ${req.session.deviceId || 'not set'}`);

        const authStatusData = {
            sid: sessionId,
            uid: userId,
            isAuthenticated: isAuthenticated
        };

        response.setResult({ data: authStatusData });
        res.status(200).send(response);

    } catch (error) {
        logger.error('Error fetching auth status:', error);
        const statusCode = (error as any).statusCode || 500;
        response.setError({
            err: "ERR_GET_AUTH_STATUS",
            errmsg: (error as Error)?.message || 'Failed to retrieve authentication status',
            responseCode: "SERVER_ERROR"
        });
        res.status(statusCode).send(response);
    }
};
