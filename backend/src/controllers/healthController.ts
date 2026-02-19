import { Request, Response as ExpressResponse } from 'express';
import { Pool } from '@yugabytedb/pg';
import { envConfig } from '../config/env.js';
import { Response } from '../models/Response.js';
import { logger } from '../utils/logger.js';

let healthPool: Pool | null = null;

const getHealthPool = (): Pool => {
    if (!healthPool) {
        healthPool = new Pool({
            host: envConfig.SUNBIRD_YUGABYTE_HOST,
            port: envConfig.SUNBIRD_YUGABYTE_PORT,
            database: envConfig.SUNBIRD_YUGABYTE_DATABASE,
            user: envConfig.SUNBIRD_YUGABYTE_USER,
            password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
            // Use a very small pool for health checks to minimize connection impact
            max: 1,
        });

        healthPool.on('error', (err: Error) => {
            const details = err instanceof Error
                ? (err.stack || err.message)
                : String(err);
            logger.error(`YugabyteDB Health Pool Error: ${details}`);
        });
    }
    return healthPool;
};

/**
 * Controller for health check operations.
 * Checks connectivity to YugabyteDB and other dependencies.
 */
const checkYugabyteHealth = async () => {
    try {
        const pool = getHealthPool();
        await pool.query('SELECT 1');
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
