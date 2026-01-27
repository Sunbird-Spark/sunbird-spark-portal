import { Request, Response as ExpressResponse } from 'express';
import { ysqlPool } from '../utils/sessionStore.js';
import { Response } from '../models/Response.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for health check operations.
 * Checks connectivity to YugabyteDB and other dependencies.
 */
export const checkHealth = async (req: Request, res: ExpressResponse) => {
    const response = new Response('api.portal.health');
    const checksArrayObj = [];
    let healthy = true;

    try {
        if (ysqlPool) {
            await ysqlPool.query('SELECT 1');
            checksArrayObj.push({
                name: 'YugabyteDB',
                healthy: true,
                err: '',
                errmsg: ''
            });
        } else {
            throw new Error('YugabyteDB pool not initialized');
        }
    } catch (err) {
        healthy = false;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        checksArrayObj.push({
            name: 'YugabyteDB',
            healthy: false,
            err: 'YUGABYTE_HEALTH_FAILED',
            errmsg: 'YugabyteDB is not connected' // Sanitized: Avoid exposing internal error details here
        });
        // Log the actual error for internal debugging using standard logger
        logger.error('Yugabyte Health Check Failed:', errorMessage);
    }

    const healthResult = {
        name: 'Portal',
        version: '1.0',
        healthy: healthy,
        check: checksArrayObj
    };

    if (healthy) {
        response.setResult({ data: healthResult });
        return res.status(200).send(response);
    } else {
        response.setError({
            err: 'SERVICE_UNAVAILABLE',
            errmsg: 'Health Service is unavailable',
            responseCode: 'SERVICE_UNAVAILABLE'
        });
        response.result = healthResult;

        return res.status(503).send(response);
    }
};