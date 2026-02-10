import { Request, Response as ExpressResponse } from 'express';
import { ysqlPool } from '../utils/sessionStore.js';
import { Response } from '../models/Response.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for health check operations.
 * Checks connectivity to YugabyteDB and other dependencies.
 */
const checkYugabyteHealth = async () => {
    try {
        if (!ysqlPool) {
            throw new Error('YugabyteDB pool not initialized');
        }
        await ysqlPool.query('SELECT 1');
        return {
            name: 'YugabyteDB',
            healthy: true,
            err: '',
            errmsg: ''
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Yugabyte Health Check Failed:', errorMessage);
        return {
            name: 'YugabyteDB',
            healthy: false,
            err: 'YUGABYTE_HEALTH_FAILED',
            errmsg: 'YugabyteDB is not connected'
        };
    }
};

export const checkHealth = async (req: Request, res: ExpressResponse) => {
    const response = new Response('api.portal.health');

    const yugabyteCheck = await checkYugabyteHealth();
    const checksArrayObj = [yugabyteCheck];
    const healthy = yugabyteCheck.healthy;

    const healthResult = {
        name: 'portal',
        version: '1.0',
        healthy,
        check: checksArrayObj
    };

    if (healthy) {
        response.setResult({ data: healthResult });
        return res.status(200).send(response);
    }

    response.setError({
        err: 'SERVICE_UNAVAILABLE',
        errmsg: 'portal service is unavailable',
        responseCode: 'SERVICE_UNAVAILABLE'
    }, { data: healthResult });

    return res.status(503).send(response);
};