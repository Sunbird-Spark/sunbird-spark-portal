import pg from 'pg';
import { envConfig } from '../config/env.js';

let _formsPool: pg.Pool | null = null;

export const getFormsPool = (): pg.Pool => {
    if (!_formsPool) {
        _formsPool = new pg.Pool({
            host: envConfig.SUNBIRD_YUGABYTE_HOST,
            port: envConfig.SUNBIRD_YUGABYTE_PORT,
            database: envConfig.FORMS_DB_NAME,
            user: envConfig.SUNBIRD_YUGABYTE_USER,
            password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
        });

        (async () => {
            try {
                await _formsPool!.query('SELECT 1');
                console.log('Forms database pool connection test succeeded.');
            } catch (error) {
                console.error('Forms database pool connection test failed:', error);
                if (process.env.NODE_ENV !== 'test') {
                    process.exit(1);
                }
            }
        })();
    }
    return _formsPool;
};
