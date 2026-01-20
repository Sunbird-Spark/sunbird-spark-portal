import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import logger from './logger.js';
import { envConfig } from '../config/env.js';

const PgStore = connectPgSimple(session);

/**
 * Initializes and returns the appropriate session store based on configuration.
 */
export const getSessionStore = () => {
    if (envConfig.SUNBIRD_PORTAL_SESSION_STORE === 'yugabyte') {
        const ysqlPool = new pg.Pool({
            host: envConfig.SUNBIRD_YUGABYTE_HOST,
            port: envConfig.SUNBIRD_YUGABYTE_PORT,
            database: envConfig.SUNBIRD_YUGABYTE_DATABASE,
            user: envConfig.SUNBIRD_YUGABYTE_USER,
            password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
        });

        ysqlPool.connect((err, client, release) => {
            if (err) {
                logger.error('Failed to connect to YugabyteDB pool', err);
                // Don't exit in test environment to prevent worker crashes
                if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
                    process.exit(1);
                }
            } else {
                logger.info('Successfully connected to YugabyteDB pool');
                release();
            }
        });

        logger.info('Using YugabyteDB (PostgreSQL-compatible) for session management');
        const store = new PgStore({
            pool: ysqlPool,
            tableName: 'sessions',
            createTableIfMissing: true,
            ttl: envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL / 1000 // convert from milliseconds to seconds
        });

        store.on('error', (error) => {
            logger.error('Session store error', error);
        });

        return store;
    }

    logger.info('Using MemoryStore for session management');
    return new session.MemoryStore();
};

export const sessionStore = getSessionStore();
